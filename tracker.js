"use strict";

import * as dgram from "node:dgram";
import {URL} from "node:url";
import * as crypto from "node:crypto";
import * as buffer from "node:buffer";

const getPeers = (torrent, callback) => {
    const socket = dgram.createSocket("udp4");
    const url = torrent.announce.toString("utf-8");

    socket.on("message", res => {
        if(respType(res) === "connect") {
            const connResp = parseConnResp(response);
            const announceReq = buildAnnounceReq(connResp.connectionId);
            udpSend(socket, announceReq, url);
        } else if(respType(res) === "announce") {
            const announceResp = parseAnnounceResp(response);
            callback(announceResp.peers);
        }
    })
}

const udpSend = (socket, msg, rawUrl, cb) => {
    const url = new URL(rawUrl);
    socket.send(msg, 0, msg.length, url.port, url.host, cb);
}

const respType = (resp) => {}

const buildConnReq = (connResp) => {
}

const parseConnResp = (resp) => {
}

const buildAnnounceReq = (connId) => {
}

const parseAnnounceResp = (resp) => {
}

const createReq = () => {
    const buffer = Buffer.alloc(16);

    buffer.writeUInt32BE(0x417, 0);
    buffer.writeUInt32BE(0x27101980, 4);
    buffer.writeUInt32BE(0, 8);
    crypto.randomBytes(4).copy(buffer, 12);

    return buffer;
}

export  {getPeers}