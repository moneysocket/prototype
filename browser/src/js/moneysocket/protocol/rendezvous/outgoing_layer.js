// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolLayer =  require("../layer.js").ProtocolLayer;
const OutgoingRendezvousNexus = require(
    "./outgoing_nexus.js").OutgoingRendezvousNexus;


class OutgoingRendezvousLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer);
    }

    announceNexusFromBelowCb(below_nexus) {
        var rendezvous_nexus = new OutgoingRendezvousNexus(below_nexus, this);
        this._trackNexus(rendezvous_nexus, below_nexus);

        var shared_seed = rendezvous_nexus.getSharedSeed();
        var rid = shared_seed.deriveRendezvousIdHex();
        this.notifyAppOfStatus(rendezvous_nexus, "NEXUS_WAITING");
        rendezvous_nexus.startRendezvous(rid,
                                         this.rendezvousFinishedCb.bind(this));
    }

    rendezvousFinishedCb(rendezvous_nexus) {
        this._trackNexusAnnounced(rendezvous_nexus);
        this.announceNexusAboveCb(rendezvous_nexus);
    }

}

exports.OutgoingRendezvousLayer = OutgoingRendezvousLayer;
