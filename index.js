"use strict"

import * as fs from 'fs';
import * as dgram from "node:dgram";
import {default as bencode }  from 'bencode';
import {Buffer} from 'buffer';
import {URL} from "node:url";
import {getPeers} from "./tracker.js";
const torrent = bencode.decode(fs.readFileSync("./puppy.torrent"), undefined , undefined , "utf-8");


getPeers(torrent, peers => {
    console.log("list of peers", peers);
});
