// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const BinUtl = require('../../utl/bin.js').BinUtl;
const Uuid = require('../../utl/uuid.js').Uuid;

const MoneysocketCodec = require('../../message/codec.js').MoneysocketCodec;

class OutgoingSocket {
    // Make the native WebSocket class look like a ProtocolNexus to be passed
    // upwards
    constructor(websocket_location, shared_seed, layer) {
        this.websocket_location = websocket_location;
        this.shared_seed = shared_seed;
        this.layer = layer;
        this.uuid = Uuid.uuidv4();

        var ws_url = websocket_location.toWsUrl();

        this.websocket = new WebSocket(ws_url);

        this.websocket.onmessage = (function(event) {
            this.handleMessage(event);
        }).bind(this);
        this.websocket.onopen = (function(event) {
            this.handleOpen(event);
        }).bind(this);
        this.websocket.onclose = (function(event) {
            this.handleClose(event);
        }).bind(this);
        this.websocket.onerror = (function(error) {
            this.handleError(error);
        }).bind(this);
    }

    async handleMessage(event) {
        if (event.data instanceof Blob) {
            //console.log("ws recv data: " + event.data);
            var msg_bytes = await BinUtl.blob2Uint8Array(event.data);
            //console.log("msg_bytes data: " + BinUtl.b2h(msg_bytes));
            var [msg, err] = MoneysocketCodec.wireDecode(msg_bytes,
                                                         this.shared_seed);
            if (err != null) {
                console.error("message decode error: " + err);
            }
            this.upwardRecvCb(this, msg);
        } else {
            console.error("received unexpected non-binary message");
        }
    }

    handleOpen(event) {
        console.log("websocket open: " + event);
        this.layer.announceNexusFromBelowCb(this);
    }

    handleClose(event) {
        console.log("closed");
        console.log("event: " + event);
        console.log("event.code: " + event.code);
        console.log("event.reason: " + event.reason);
        console.log("event.wasClean: " + event.wasClean);
        this.layer.revokeNexusFromBelowCb(this);
    }

    handleError(error) {
        console.log("error: " + error);
    }

    ///////////////////////////////////////////////////////////////////////////

    getDownwardNexusList() {
        return [this];
    }

    downlineStr() {
        var s = "";
        var nexus_list = this.getDownwardNexusList();
        for (var i=0; i < nexus_list.length; i++) {
            s = s + nexus_list[i].toString() + "\n";
        }
        return s.trim();
    }

    toString() {
        return this.constructor.name + " uuid: " + this.uuid;
    }

    ///////////////////////////////////////////////////////////////////////////

    send(msg) {
        var msg_bytes = MoneysocketCodec.wireEncode(msg, this.shared_seed);
        this.sendRaw(msg_bytes);
    }

    sendRaw(msg_bytes) {
        this.websocket.send(msg_bytes.buffer);
    }

    initiateClose() {
        this.websocket.close();
    }

    //////////////////////////////////////////////////////////////////////////

    registerUpwardRecvCb(upward_recv_cb) {
        // TODO - bind() this?
        this.upwardRecvCb = upward_recv_cb;
    }

    registerUpwardRecvRawCb(upward_recv_raw_cb) {
        // TODO - bind() this?
        this.upwardRecvRawCb = upward_recv_raw_cb;
    }

    //////////////////////////////////////////////////////////////////////////

    getSharedSeed() {
        return this.shared_seed;
    }
}



exports.OutgoingSocket = OutgoingSocket;
