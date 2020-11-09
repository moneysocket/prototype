// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolNexus = require("../nexus.js").ProtocolNexus;


class WebsocketNexus extends ProtocolNexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);
        // below_nexus is an OutgoingSocket instance
    }
}

exports.WebsocketNexus = WebsocketNexus;
