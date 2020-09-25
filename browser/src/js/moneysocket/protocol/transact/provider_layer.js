// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolLayer =  require("../layer.js").ProtocolLayer;
const ProviderTransactNexus = require(
    "./provider_nexus.js").ProviderTransactNexus;



class ProviderTransactLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer, "PROVIDER_TRANSACT");
        console.assert(typeof stack.gotRequestInvoiceCb == 'function');
        console.assert(typeof stack.gotRequestPayCb == 'function');
    }

    announceNexusFromBelowCb(below_nexus) {
        console.log("consumer layer got nexus, starting handshake");
        var provider_transact_nexus = new ProviderTransactNexus(below_nexus,
                                                                this);
        this._trackNexus(provider_transact_nexus, below_nexus);
        this._trackNexusAnnounced(provider_transact_nexus);
        this.announceNexusAboveCb(provider_transact_nexus);
    }

    requestInvoiceCb(provider_transact_nexus, msats, request_uuid) {
        this.stack.gotRequestInvoiceCb(msats, request_uuid);
    }

    requestPayCb(provider_transact_nexus, preimage, request_uuid) {
        this.stack.gotRequestPayCb(preimage, request_uuid);
    }

}


exports.ProviderTransactLayer = ProviderTransactLayer;
