"use strict"

import * as fs from 'fs';
import * as dgram from "node:dgram";
import {default as bencode }  from 'bencode';
import {Buffer} from 'buffer';
import {URL} from "node:url";
const torrent = bencode.decode(fs.readFileSync("./puppy.torrent"), undefined , undefined , "utf-8");

const url = new URL(torrent.announce.toString("utf-8"));
const socket = dgram.createSocket("udp4");
const msg = Buffer.from("hello", "utf-8");


socket.send(msg, 0, msg.length, url.port, url.host, () => {});

socket.on('message', msg => {
    console.log('message is', msg);
});