// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Layer =  require("./layer.js").Layer;
const ProviderTransactNexus = require(
    "../nexus/provider_transact.js").ProviderTransactNexus;



class ProviderTransactLayer extends Layer {
    constructor() {
        super();
        this.handleinvoicerequest = null;
        this.handlepayrequest = null;
    }

    setupProviderTransactNexus(below_nexus) {
        var n = new ProviderTransactNexus(below_nexus, this);
        n.handleinvoicerequest = (function(nexus, bolt11, request_uuid) {
            this.handleInvoiceRequest(nexus, msats, request_uuid);
        }).bind(this);
        n.handlepayrequest = (function(nexus, bolt11, request_uuid) {
            this.handlePayRequest(nexus, bolt11, request_uuid);
        }).bind(this);
        return n;
    }

    announceNexus(below_nexus) {
        console.log("consumer layer got nexus, starting handshake");
        var provider_transact_nexus = this.setupProviderTransactNexus(
            below_nexus);
        this._trackNexus(provider_transact_nexus, below_nexus);
        this._trackNexusAnnounced(provider_transact_nexus);
        if (this.onannounce != null) {
            this.onannounce(provider_transact_nexus);
        }
    }

    handleInvoiceRequest(provider_transact_nexus, msats, request_uuid) {
        if (this.handleinvoicerequest != null) {
            this.handleinvoicerequest(provider_transact_nexus, msats,
                                      request_uuid);
        }
    }

    handlePayRequest(provider_transact_nexus, bolt11, request_uuid) {
        if (this.handlepayrequest != null) {
            this.handlepayrequest(provider_transact_nexus, bolt11,
                                  request_uuid);
        }
    }

}


exports.ProviderTransactLayer = ProviderTransactLayer;
