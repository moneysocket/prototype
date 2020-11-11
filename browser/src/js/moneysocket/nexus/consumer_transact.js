// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Timestamp = require('../utl/timestamp.js').Timestamp;
const Nexus = require("./nexus.js").Nexus;

const RequestInvoice = require(
    "../message/request/invoice.js").RequestInvoice;
const RequestPay = require("../message/request/pay.js").RequestPay;


const LAYER_NOTIFICATIONS = new Set(["NOTIFY_INVOICE",
                                     "NOTIFY_PREIMAGE",
                                   ]);

class ConsumerTransactNexus extends Nexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);

        this.oninvoice = null;
        this.onpreimage = null;
    }

    ///////////////////////////////////////////////////////////////////////////

    handleLayerNotification(msg) {
        if (msg['notification_name'] == "NOTIFY_INVOICE") {
            if (this.oninvoice != null) {
                this.oninvoice(this, msg['bolt11'],
                              msg['request_reference_uuid']);
            }
        }
        else if (msg['notification_name'] == "NOTIFY_PREIMAGE") {
            console.log("notify preimage: " + JSON.stringify(msg));
            if (this.onpreimage != null) {
                this.onpreimage(this, msg['preimage'],
                                msg['request_reference_uuid']);
            }
        }
    }


    isLayerMessage(msg) {
        if (msg['message_class'] != "NOTIFICATION") {
            return false;
        }
        return LAYER_NOTIFICATIONS.has(msg['notification_name']);
    }

    onMessage(below_nexus, msg) {
        //console.log("transact nexus got message");
        if (! this.isLayerMessage(msg)) {
            super.onMessage(below_nexus, msg)
            return;
        }
        this.handleLayerNotification(msg);
    }

    onBinMessage(below_nexus, msg_bytes) {
        //console.log("transact nexus got raw msg from below");
    }

    ///////////////////////////////////////////////////////////////////////////

    requestInvoice(msats, override_request_uuid, description) {
        var ri = new RequestInvoice(msats);
        if (override_request_uuid != null) {
            ri.request_uuid = override_request_uuid;
        }
        this.send(ri);
    }

    requestPay(bolt11, override_request_uuid) {
        var rp = new RequestPay(bolt11);
        if (override_request_uuid != null) {
            rp.request_uuid = override_request_uuid;
        }
        this.send(rp);
    }

}

exports.ConsumerTransactNexus = ConsumerTransactNexus;
