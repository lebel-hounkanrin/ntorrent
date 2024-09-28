import * as net from "node:net";
import {Buffer} from "buffer";

const socket = net.Socket();

socket.on("error", () => {console.log("Something went wrong!")});
socket.connect(port, ip, () => {
    socket.write(Buffer.from("hello here "));
});
socket.on('data', res => {
});