// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Timestamp = require('../moneysocket/utl/timestamp.js').Timestamp;
const Nexus = require("../moneysocket/nexus/nexus.js").Nexus;

const RequestOpinionSeller = require(
    "./request_opinion_seller.js").RequestOpinionSeller;
const RequestOpinionInvoice = require(
    "./request_opinion_invoice.js").RequestOpinionInvoice;

const NotifyOpinionSeller = require(
    "../seller/notify_opinion_seller.js").NotifyOpinionSeller;
const NotifyOpinionSellerNotReady = require(
    "../seller/notify_opinion_seller_not_ready.js").NotifyOpinionSellerNotReady;
const NotifyOpinionInvoice = require(
    "../seller/notify_opinion_invoice.js").NotifyOpinionInvoice;
const NotifyOpinion = require("../seller/notify_opinion.js").NotifyOpinion;

const LAYER_NOTIFICATIONS = new Set(["NOTIFY_OPINION_SELLER",
                                     "NOTIFY_OPINION_SELLER_NOT_READY",
                                     "NOTIFY_OPINION_INVOICE",
                                     "NOTIFY_OPINION",
                                   ]);

class BuyerNexus extends Nexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);

        this.onsellerinfo = null;
        this.onopinioninvoice = null;
        this.onopinion = null;

        this.consumerFinishedCb = null;
        this.request_reference_uuid = null;
        this.handshake_finished = false;
    }

    ///////////////////////////////////////////////////////////////////////////

    isLayerMessage(msg) {
        if (msg['message_class'] != "NOTIFICATION") {
            return false;
        }
        return LAYER_NOTIFICATIONS.has(msg['notification_name']);
    }

    onMessage(below_nexus, msg) {
        //console.log("consumer nexus got message");
        if (! this.isLayerMessage(msg)) {
            super.recvFromBelowCb(below_nexus, msg)
            return;
        }
        if (msg['notification_name'] == "NOTIFY_OPINION_SELLER") {
            if (! this.handshake_finished) {
                this.handshake_finished = true;
                this.sellerFinishedCb(this);
            }
            var seller_info = msg;
            if (this.onsellerinfo != null) {
                this.onsellerinfo(this, seller_info);
            }
        } else if (msg['notification_name'] == "NOTIFY_OPINION_INVOICE") {
            console.log("opinion invoice: " + JSON.stringify(msg));
            if (this.onopinioninvoice != null) {
                this.onopinioninvoice(this, msg['bolt11'],
                    msg['request_reference_uuid']);
            }
        } else if (msg['notification_name'] == "NOTIFY_OPINION") {
            if (this.onopinion != null) {
                this.onopinion(this, msg['item_id'], msg['opinion']);
            }
        }
    }

    onBinMessage(below_nexus, msg_bytes) {
        console.log("buyer nexus got raw msg from below");
    }

    startHandshake(sellerFinishedCb) {
        this.sellerFinishedCb = sellerFinishedCb;
        console.log("req seller");
        this.send(new RequestOpinionSeller());
    }

    requestOpinionInvoice(item_id) {
        console.log("req opinion invoice");
        this.send(new RequestOpinionInvoice(item_id));
    }
}

exports.BuyerNexus = BuyerNexus;
