// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const BinUtl = require('../utl/bin.js').BinUtl;
const Uuid = require('../utl/uuid.js').Uuid;

const MoneysocketCodec = require('../message/codec.js').MoneysocketCodec;

class OutgoingSocket {
    // Make the native WebSocket class look like a Nexus to be passed
    // upwards
    constructor(websocket_location, shared_seed, layer) {
        this.websocket_location = websocket_location;
        this.shared_seed = shared_seed;
        this.layer = layer;
        this.uuid = Uuid.uuidv4();

        this.onmessage = null;
        this.onbinmessage = null;

        var ws_url = websocket_location.toWsUrl();
        this.websocket = this.setupWebsocket(ws_url);
    }

    setupWebsocket(ws_url) {
        var w = new WebSocket(ws_url);
        w.onmessage = (function(event) {
            this.onMessage(event);
        }).bind(this);
        w.onopen = (function(event) {
            this.onOpen(event);
        }).bind(this);
        w.onclose = (function(event) {
            this.onClose(event);
        }).bind(this);
        w.onerror = (function(error) {
            this.onError(error);
        }).bind(this);
        return w;
    }

    async onMessage(event) {
        if (event.data instanceof Blob) {
            //console.log("ws recv data: " + event.data);
            var msg_bytes = await BinUtl.blob2Uint8Array(event.data);
            //console.log("msg_bytes data: " + BinUtl.b2h(msg_bytes));
            var [msg, err] = MoneysocketCodec.wireDecode(msg_bytes,
                                                         this.shared_seed);
            if (err != null) {
                console.error("message decode error: " + err);
                // TODO - handle binary messages in Javascript env?
                // Probably needed for Node.js backend services.
            }
            if (this.onmessage != null) {
                this.onmessage(this, msg);
            }
        } else {
            console.error("received unexpected non-binary message");
        }
    }

    onOpen(event) {
        console.log("websocket open: " + event);
        this.layer.announceNexus(this);
    }

    onClose(event) {
        console.log("closed");
        console.log("event: " + event);
        console.log("event.code: " + event.code);
        console.log("event.reason: " + event.reason);
        console.log("event.wasClean: " + event.wasClean);
        this.layer.revokeNexus(this);
    }

    onError(error) {
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
        this.sendBin(msg_bytes);
    }

    sendBin(msg_bytes) {
        this.websocket.send(msg_bytes.buffer);
    }

    initiateClose() {
        this.websocket.close();
    }

    //////////////////////////////////////////////////////////////////////////

    getSharedSeed() {
        return this.shared_seed;
    }
}



exports.OutgoingSocket = OutgoingSocket;
