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
    console.log("Getting Peers start....")
    const socket = dgram.createSocket("udp4");
    const url = torrent.announce.toString("utf-8");
    const reqBody = createReq();
    udpSend(socket, reqBody, url);

    socket.on("message", res => {
        if(respType(res) === "connect") {
            const connResp = parseConnResp(res);
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
            udpSend(socket, announceReq, url);
        } else if(respType(res) === "announce") {
            const announceResp = parseAnnounceResp(res);
            callback(announceResp.peers);
        }
    });

    socket.on("error", err => {"something went wrong"});
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
    socket.send(msg, 0, msg.length, url.port, url.hostname, cb);
}

const respType = (resp) => {
    return resp.readUInt32BE(0) === 0 ?  "connect" : "announce";
}

/**
 * Cette fonction formate la requête a envoyé au tracker
 * @param connId
 * @param torrent
 * @param port
 */
const buildAnnounceReq = (connId, torrent, port=6881) => {
    const buffer = Buffer.allocUnsafe(98);
    console.log("Building Announce request....")

    connId.copy(buffer, 0); // connection_id
    buffer.writeUInt32BE(1, 8); // action, 1 for the announce req
    crypto.randomBytes(4).copy(buffer, 12); // generate transaction id
    getInfoHash(torrent).copy(buffer, 64); // info_hash
    genId().copy(buffer, 36); //peer_id
    Buffer.allocUnsafe(8).copy(buffer, 56); //downloaded
    getTorrentSize(torrent).copy(buffer, 64); //left
    Buffer.alloc(8).copy(buffer, 72); //uploaded
    buffer.writeUInt32BE(0, 80); //event
    buffer.writeUInt32BE(0, 84); //optional ip add
    crypto.randomBytes(4).copy(buffer, 88); //random key
    buffer.writeInt32BE(-1, 92); //Number of peers that the client would like to receive from the tracker.
    buffer.writeUInt16BE(port, 96);

    return buffer
}

const parseAnnounceResp = (resp) => {
    console.log("Parsing Announce Response....")
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
    console.log("Building Connection request....")

    const buffer = Buffer.alloc(16);

    buffer.writeUInt32BE(0x417, 0);
    buffer.writeUInt32BE(0x27101980, 4);
    buffer.writeUInt32BE(0, 8);
    crypto.randomBytes(4).copy(buffer, 12);

    return buffer;
}

const parseConnResp = (res) => {
    console.log("Parsing Connection response....")
    return {
        action: res.readUInt32BE(0),
        transactionId: res.readUInt32BE(4),
        connectionId: res.slice(8)
    }
}

const getInfoHash =  (torrent) => {
    const info = bencode.encode(torrent.info)
    return crypto.createHash("sha1").update(info).digest();
}
const getTorrentSize = (torrent) => {
    const totalSize = torrent.info.files
        ? torrent.info.files.map(f => f.length).reduce((a, b) => a + b, 0)
        : torrent.info.length;

    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(totalSize));
    return buffer;
};

export  {getPeers, getInfoHash}