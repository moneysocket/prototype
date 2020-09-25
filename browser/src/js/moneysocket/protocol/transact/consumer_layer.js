// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolLayer =  require("../layer.js").ProtocolLayer;
const ConsumerTransactNexus = require(
    "./consumer_nexus.js").ConsumerTransactNexus;



class ConsumerTransactLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer, "CONSUMER_TRANSACT");
        console.assert(typeof stack.notifyPreimageCb == 'function');
        console.assert(typeof stack.notifyInvoiceCb == 'function');
    }

    announceNexusFromBelowCb(below_nexus) {
        console.log("consumer transact layer got nexus");
        var consumer_transact_nexus = new ConsumerTransactNexus(below_nexus,
                                                                this);
        this._trackNexus(consumer_transact_nexus, below_nexus);
        this._trackNexusAnnounced(consumer_transact_nexus);
        this.announceNexusAboveCb(consumer_transact_nexus);
    }

    notifyInvoiceCb(consumer_transact_nexus, bolt11, request_reference_uuid) {
        this.stack.notifyInvoiceCb(consumer_transact_nexus, bolt11,
                                   request_reference_uuid);
    }

    notifyPreimageCb(consumer_transact_nexus, preimage,
                     request_reference_uuid) {
        this.stack.notifyPreimageCb(consumer_transact_nexus, preimage,
                                    request_reference_uuid);
    }
}


exports.ConsumerTransactLayer = ConsumerTransactLayer;
