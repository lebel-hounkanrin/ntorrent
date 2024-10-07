import * as net from "node:net";
import {Buffer} from "buffer";
import {buildHandshake, buildInterestedMsg, buildRequest} from "./message.js";


export const download = (peer, torrent, pieces) => {
    const {ip: peer_ip, port: peer_port} = peer;
    const socket = net.Socket();
    const queue = {choked: true, queue: []};
    socket.on("error", (err) => {
        console.log(err);
    });
    socket.connect(peer_port, peer_ip, () => {
        console.log("Connected to peer ", peer_ip);
        socket.write(buildHandshake(torrent));
    });
    onWhileMsg(socket, (msg) => msgHandler(msg, socket, pieces, queue));
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

const msgHandler = (message, socket, pieces, queue) => {
    if(isHandshake(message)) socket.write(buildInterestedMsg());
    else {
        const parsedMessage = parse(message);
        switch(parsedMessage.id) {
            case 0: chokeHandler(socket); break;
            case 1: unchokeHandler(socket, pieces, queue); break;
            case 4: haveHandler(parsedMessage.payload, socket, requested, queue); break;
            case 5: bitfieldHandler(parsedMessage.payload); break;
            case 7: pieceHandler(parsedMessage.payload, queue); break;
        }
    }
}

const isHandshake = (msg) => {
    return msg.length === msg.readUInt8(0) + 49 && msg.toString('utf8', 1) === 'BitTorrent protocol';
}

export const parse = (message) => {
    const id = message.length > 4 ? message.readInt8(4) : null;
    let payload = message.length > 5 ? message.slice(5) : null;
    if ([6, 7, 8].includes(id)) {
        const rest = payload.slice(8);
        payload = {
            index: payload.readInt32BE(0),
            begin: payload.readInt32BE(4)
        };
        payload[id === 7 ? 'block' : 'length'] = rest;
    }

    return {
        size : message.readInt32BE(0),
        id : id,
        payload : payload
    }
}

const chokeHandler = (socket) => {socket.end()}
const unchokeHandler = (socket, pieces, queue) => {
    queue.choked = false;
    requestPiece(socket, pieces, queue);
}
const haveHandler = (payload, socket, requested, queue) => {
    const pieceIndex = payload.readUInt32BE(0);
    queue.push(pieceIndex);
    if (queue.length === 1) {
        requestPiece(socket, requested, queue);
    }
}
const bitfieldHandler = (payload) => {}
const pieceHandler = (payload, socket, requested, queue) => {
    queue.shift();
    requestPiece(socket, requested, queue);
}
const requestPiece = (socket, pieces, queue) => {
    if (queue.choked) return null;
    while (queue.queue.length) {
        const pieceIndex = queue.shift();
        if (pieces.needed(pieceIndex)) {
            socket.write(buildRequest(pieceIndex));
            pieces.addRequested(pieceIndex);
            break;
        }
    }
}