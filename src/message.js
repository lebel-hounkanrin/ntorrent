import {Buffer} from "buffer";
import {getInfoHash} from "./tracker.js";
import {genId} from "./utils.js";


export const buildHandshake = (torrent) =>  {
    const pstr = "BitTorrent protocol" //string identifier of the protocol
    const buffer = Buffer.alloc(68);
    buffer.writeUInt8(pstr.length, 0); //pstrlen
    buffer.write(pstr, 1) //pstr
    buffer.writeUInt32BE(0, 20); //reserved
    buffer.writeUInt32BE(0, 24); //reserved
    const infoHash = getInfoHash(torrent);
    infoHash.copy(buffer, 28);
    const peerId = genId()
    peerId.copy(buffer, 48);
    // buffer.write(genId(), 48); //peer id
    return buffer;
}

export const  _buildHanshake = (torrent) =>  {
    const pstr = 'BitTorrent protocol';

    const pstrlen = Buffer.from([pstr.length]);

    const reserved = Buffer.alloc(8, 0);

    const infoHash = Buffer.from(getInfoHash(torrent), 'hex');
    console.log(infoHash)

    const peerID = Buffer.from("00112233445566778899");
    return Buffer.concat([
        pstrlen,
        Buffer.from(pstr),
        reserved,
        infoHash,
        peerID
    ]);
}

export const buildInterestedMsg = () => {
    const buffer = Buffer.alloc(5);
    buffer.writeUInt32BE(1, 0);
    buffer.writeUInt8(2, 4);
    return buffer;
}

export const buildRequest = (payload) => {
    const buf = Buffer.alloc(17);
    buf.writeUInt32BE(13, 0);
    buf.writeUInt8(6, 4);
    buf.writeUInt32BE(payload.index, 5);
    buf.writeUInt32BE(payload.begin, 9);
    buf.writeUInt32BE(payload.length, 13);
    return buf;
}
