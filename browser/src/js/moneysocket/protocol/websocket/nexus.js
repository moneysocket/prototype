// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolNexus = require("../nexus.js").ProtocolNexus;



class WebsocketNexus extends ProtocolNexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);
    }

    recvFromBelowCb(below_nexus, msg) {
        //console.log("websocket nexus got msg from below");
        super.recvFromBelowCb(below_nexus, msg);
    }

    recvRawFromBelowCb(below_nexus, msg_bytes) {
        //console.log("websocket nexus got raw msg from below");
        super.recvRawFromBelowCb(below_nexus, msg_bytes);
    }
}

exports.WebsocketNexus = WebsocketNexus;
