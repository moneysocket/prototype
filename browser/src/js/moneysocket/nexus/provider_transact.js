// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Timestamp = require('../utl/timestamp.js').Timestamp;
const Nexus = require("./nexus.js").Nexus;

const NotifyInvoice = require(
    "../message/notification/invoice.js").NotifyInvoice;
const NotifyPreimage = require(
    "../message/notification/preimage.js").NotifyPreimage;


const LAYER_REQUESTS = new Set(["REQUEST_PAY",
                                "REQUEST_INVOICE",
                               ]);

class ProviderTransactNexus extends Nexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);
        this.handleinvoicerequest = null;
        this.handlepayrequest = null;
    }

    ///////////////////////////////////////////////////////////////////////////

    handleLayerRequest(msg) {
        if (msg['request_name'] == "REQUEST_INVOICE") {
            if (this.handleinvoicerequest != null) {
                this.handleinvoicerequest(this, msg['msats'],
                                          msg['request_uuid']);
            }
        } else if (msg['request_name'] == "REQUEST_PAY") {
            if (this.handlepayrequest != null) {
                this.handlepayrequest(this, msg['bolt11'], msg['request_uuid']);
            }
        }
    }

    isLayerMessage(msg) {
        if (msg['message_class'] != "REQUEST") {
            return false;
        }
        return LAYER_REQUESTS.has(msg['request_name']);
    }

    onMessage(below_nexus, msg) {
        //console.log("provider transact nexus got message");
        if (! this.isLayerMessage(msg)) {
            super.onMessage(below_nexus, msg)
            return;
        }
        this.handleLayerRequest(msg);
    }

    onBinMessage(below_nexus, msg_bytes) {
        //console.log("transact nexus got raw msg from below");
    }

    notifyInvoice(bolt11, request_reference_uuid) {
        this.send(new NotifyInvoice(bolt11, request_reference_uuid));
    }

    notifyPreimage(preimage, request_reference_uuid) {
        this.send(new NotifyPreimage(preimage, null, request_reference_uuid));
    }

}

exports.ProviderTransactNexus = ProviderTransactNexus;
