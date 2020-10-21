// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolLayer =  require("../layer.js").ProtocolLayer;
const ConsumerNexus = require("./nexus.js").ConsumerNexus;



class ConsumerLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer, "CONSUMER");
        console.assert(typeof stack.notifyProviderCb == 'function');
        console.assert(typeof stack.notifyPingCb == 'function');
    }

    announceNexusFromBelowCb(below_nexus) {
        console.log("consumer layer got nexus, starting handshake");
        var consumer_nexus = new ConsumerNexus(below_nexus, this);
        this._trackNexus(consumer_nexus, below_nexus);

        consumer_nexus.startHandshake(this.consumerFinishedCb.bind(this));
    }

    consumerFinishedCb(consumer_nexus) {
        this._trackNexusAnnounced(consumer_nexus);
        this.notifyAppOfStatus(consumer_nexus, "NEXUS_ANNOUNCED");
        this.announceNexusAboveCb(consumer_nexus);
        consumer_nexus.startPinging();
    }

    revokeNexusFromBelowCb(below_nexus) {
        var consumer_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexusFromBelowCb(below_nexus);
        consumer_nexus.stopPinging();
    }

    notifyProviderCb(consumer_nexus, msg) {
        this.stack.notifyProviderCb(consumer_nexus, msg);
    }

    notifyPingCb(consumer_nexus, msecs) {
        this.stack.notifyPingCb(consumer_nexus, msecs);
    }
}


exports.ConsumerLayer = ConsumerLayer;
