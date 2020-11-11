// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Layer = require("./layer.js").Layer;
const OutgoingRendezvousNexus = require(
    "../nexus/outgoing_rendezvous.js").OutgoingRendezvousNexus;


class OutgoingRendezvousLayer extends Layer {
    constructor() {
        super();
    }

    announceNexus(below_nexus) {
        var rendezvous_nexus = new OutgoingRendezvousNexus(below_nexus, this);
        this._trackNexus(rendezvous_nexus, below_nexus);

        var shared_seed = rendezvous_nexus.getSharedSeed();
        var rid = shared_seed.deriveRendezvousIdHex();
        this.sendLayerEvent(rendezvous_nexus, "NEXUS_WAITING");
        rendezvous_nexus.startRendezvous(rid,
                                         this.rendezvousFinishedCb.bind(this));
    }

    rendezvousFinishedCb(rendezvous_nexus) {
        this._trackNexusAnnounced(rendezvous_nexus);
        if (this.onannounce != null) {
            this.onannounce(rendezvous_nexus);
        }
    }

}

exports.OutgoingRendezvousLayer = OutgoingRendezvousLayer;
