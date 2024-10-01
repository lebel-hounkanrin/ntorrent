import * as net from "node:net";
import {Buffer} from "buffer";
import {buildHandshake, buildInterestedMsg} from "./message.js";


export const download = (peer, torrent) => {
    const {peer_ip, peer_port} = peer;
    const socket = net.Socket();
    socket.on("error", err => socket.on("error", () => {console.log("Something went wrong!")}));
    console.log("Trying connection to ", peer_ip)
    socket.connect(peer_port, peer_port, () => {
        console.log("Connected to peer ", peer_ip);
        socket.write(buildHandshake(torrent));
    });
    onWhileMsg(socket, (msg, socket) => msgHandler(msg, socket));
}

const onWhileMsg = (socket, cb) => {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    socket.on("data", data => {
        const getMsgLength = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
        savedBuf = Buffer.concat([savedBuf, data]);
        while (savedBuf.length >= 4 && savedBuf.length >= getMsgLength()) {
            cb(savedBuf.slice(0, getMsgLength()));
            savedBuf = savedBuf.subarray(getMsgLength());
            handshake = false;
        }
    })
}

const msgHandler = (msg, socket) => {
    if(isHandshake(msg)) socket.write(buildInterestedMsg());
}

const isHandshake = (msg) => {
    return msg.length === msg.readUInt8(0) + 49 && msg.toString('utf8', 1) === 'BitTorrent protocol';
}