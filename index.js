"use strict"

import * as fs from 'fs';
import {default as bencode }  from 'bencode';
const torrent = bencode.decode(fs.readFileSync("./puppy.torrent"));
