// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Layer =  require("./layer.js").Layer;
const WebsocketNexus = require("../nexus/websocket.js").WebsocketNexus;
const OutgoingSocket = require("../nexus/outgoing_socket.js").OutgoingSocket;


class OutgoingWebsocketLayer extends Layer {
    constructor() {
        super();
        this.nexus_by_shared_seed = {};
    }

    announceNexus(below_nexus) {
        var websocket_nexus = new WebsocketNexus(below_nexus, this);
        this._trackNexus(websocket_nexus, below_nexus);
        this._trackNexusAnnounced(websocket_nexus);

        var shared_seed = websocket_nexus.getSharedSeed();
        this.nexus_by_shared_seed[shared_seed] = websocket_nexus;
        this.sendLayerEvent(websocket_nexus, "NEXUS_ANNOUNCED");
        if (this.onannounce != null) {
            this.onannounce(websocket_nexus);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    connect(websocket_location, shared_seed) {
        var ws = new OutgoingSocket(websocket_location, shared_seed, this);
    }

    disconnect(shared_seed) {
        if (! (shared_seed in self.nexus_by_shared_seed)) {
            return;
        }
        var websocket_nexus = this.nexus_by_shared_seed[shared_seed];
        websocket_nexus.initiateClose();
    }
}

exports.OutgoingWebsocketLayer = OutgoingWebsocketLayer;
