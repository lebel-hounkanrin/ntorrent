"use strict";

import * as dgram from "node:dgram";
import {URL} from "node:url";
import * as crypto from "node:crypto";
import * as buffer from "node:buffer";
import {genId} from "./utils.js";
import bencode from "bencode";
// import * as bignum from "bignum";

/**
 * Récupère les peers du tracker
 * @param torrent
 * @param callback
 */
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

/**
 * Envoie une requête au tracker
 * @param socket
 * @param msg
 * @param rawUrl
 * @param cb
 */
const udpSend = (socket, msg, rawUrl, cb) => {
    const url = new URL(rawUrl);
    socket.send(msg, 0, msg.length, url.port, url.host, cb);
}

const respType = (resp) => {
    return resp.readUInt32BE(0) === 0 ?  "connect" : "announce";
}

const buildConnReq = (connResp) => {
}

/**
 * Cette fonction formate la requête a envoyé au tracker
 * @param connId
 * @param torrent
 * @param port
 */
const buildAnnounceReq = (connId, torrent, port=6881) => {
    const buffer = Buffer.allocUnsafe(98);

    connId.copy(buffer, 0);
    buffer.writeUInt32BE(1, 8);
    crypto.randomBytes(4).copy(buffer, 12);
    infoHash(torrent).copy(buffer, 64);
    genId().copy(buffer, 36);
    Buffer.allocUnsafe(8).copy(buffer, 56);
    size(torrent).copy(buffer, 64);
    Buffer.alloc(8).copy(buffer, 72);
    buffer.writeUInt32BE(0, 80);
    buffer.writeUInt32BE(0, 80);
    crypto.randomBytes(4).copy(buffer, 88);
    buffer.writeUInt32BE(-1, 92);
    buffer.writeUInt32BE(port, 96);
}

const parseAnnounceResp = (resp) => {
    const group = (iterable, groupSize) => {
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            }
        })
    }
}

const createReq = () => {
    const buffer = Buffer.alloc(16);

    buffer.writeUInt32BE(0x417, 0);
    buffer.writeUInt32BE(0x27101980, 4);
    buffer.writeUInt32BE(0, 8);
    crypto.randomBytes(4).copy(buffer, 12);

    return buffer;
}

const parseConnResp = (res) => {
    return {
        action: res.readUInt32BE(0),
        transactionId: res.readUInt32BE(4),
        connectionId: res.slice(8)
    }
}

const infoHash =  (torrent) => {
    const info = bencode.encode(torrent.info)
    return crypto.createHash("sha1").update(info).digest();
}
const size =  (torrent) => {
    const size = torrent.info.files ? torrent.info.map(f => f.length).reduce((a, b) => a+b) : torrent.info.length;
    // return bignum.toBuffer(size, {size: 8})
}
export  {getPeers}