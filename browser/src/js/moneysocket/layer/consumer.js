// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Layer = require("./layer.js").Layer;
const ConsumerNexus = require("../nexus/consumer.js").ConsumerNexus;


class ConsumerLayer extends Layer {
    constructor() {
        super();
        this.onproviderinfo = null;
        this.onping = null;
    }

    setupConsumerNexus(below_nexus) {
        var n = new ConsumerNexus(below_nexus, this);
        n.onproviderinfo = (function(nexus, msg) {
            this.onProviderInfo(nexus, msg);
        }).bind(this);
        n.onping = (function(nexus, msecs) {
            this.onPing(nexus, msecs);
        }.bind(this));
        return n;
    }

    announceNexus(below_nexus) {
        console.log("consumer layer got nexus, starting handshake");
        var consumer_nexus = this.setupConsumerNexus(below_nexus);
        this._trackNexus(consumer_nexus, below_nexus);

        consumer_nexus.startHandshake(this.consumerFinishedCb.bind(this));
    }

    consumerFinishedCb(consumer_nexus) {
        this._trackNexusAnnounced(consumer_nexus);
        this.sendLayerEvent(consumer_nexus, "NEXUS_ANNOUNCED");
        if (this.onannounce != null) {
            this.onannounce(consumer_nexus);
        }
        consumer_nexus.startPinging();
    }

    revokeNexus(below_nexus) {
        var consumer_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexus(below_nexus);
        consumer_nexus.stopPinging();
    }

    ///////////////////////////////////////////////////////////////////////////

    onProviderInfo(consumer_nexus, msg) {
        if (this.onproviderinfo != null) {
            this.onproviderinfo(consumer_nexus, msg);
        }
    }

    onPing(consumer_nexus, msecs) {
        if (this.onping != null) {
            this.onping(consumer_nexus, msecs);
        }
    }
}


exports.ConsumerLayer = ConsumerLayer;
