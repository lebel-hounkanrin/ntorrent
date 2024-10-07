"use strict"

import * as fs from 'fs';
import * as dgram from "node:dgram";
import {default as bencode }  from 'bencode';
import {Buffer} from 'buffer';
import {URL} from "node:url";
import {getPeers} from "./tracker.js";
import {download} from "./download.js";
import {Pieces} from "./Pieces.js";
const torrent = bencode.decode(fs.readFileSync("./dstrange.torrent"), undefined , undefined , "utf-8");


getPeers(torrent, peers => {
    const requested = []
    const pieces = new Pieces(Math.ceil(torrent.info.pieces.length / 20));
    peers.forEach(peer => {
        download(peer, torrent, pieces);
    });
});
