// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Nexus = require("../moneysocket/protocol/nexus.js").Nexus;


const RequestOpinionSeller = require(
    "../buyer/request_opinion_seller.js").RequestOpinionSeller;
const RequestOpinionInvoice = require(
    "../buyer/request_opinion_invoice.js").RequestOpinionInvoice;

const NotifyOpinionSeller = require(
    "./notify_opinion_seller.js").NotifyOpinionSeller;
const NotifyOpinionSellerNotReady = require(
    "./notify_opinion_seller_not_ready.js").NotifyOpinionSellerNotReady;
const NotifyOpinionInvoice = require(
    "./notify_opinion_invoice.js").NotifyOpinionInvoice;
const NotifyOpinion = require("./notify_opinion.js").NotifyOpinion;


const LAYER_REQUESTS = new Set(["REQUEST_OPINION_SELLER",
                                "REQUEST_OPINION_INVOICE",
                               ]);


class SellerNexus extends Nexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);

        this.handleopinioninvoicerequest = null;
        this.handlesellerinforequest = null;

        this.seller_finished_cb = null;
        this.request_reference_uuid = null;
    }

    ///////////////////////////////////////////////////////////////////////////

    isLayerMessage(msg) {
        if (msg['message_class'] != "REQUEST") {
            return false;
        }
        return LAYER_REQUESTS.has(msg['request_name']);
    }

    onMessage(below_nexus, msg) {
        console.log("provider nexus got msg from below");
        if (! this.isLayerMessage(msg)) {
            super.onMessage(below_nexus, msg)
            return;
        }
        this.request_reference_uuid = msg['request_uuid'];
        if (msg['request_name'] == "REQUEST_OPINION_SELLER") {
            var shared_seed = below_nexus.getSharedSeed();
            console.assert(this.handlesellerinforequest != null);
            var seller_info = this.handlesellerinforequest();
            console.log("seller info: " + JSON.stringify(seller_info));
            if (seller_info['ready']) {
                this.notifySeller();
                this.seller_finished_cb(this);
            } else {
                this.notifySellerNotReady();
                this.layer.nexusWaitingForApp(shared_seed, this);
            }
        } else if (msg['request_name'] == "REQUEST_OPINION_INVOICE") {
            console.assert(this.handleopinioninvoicerequest != null);
            this.handleopinioninvoicerequest(this, msg['item_id'],
                                             msg['request_uuid']);
        }
    }

    onBinMessage(below_nexus, msg_bytes) {
        console.log("provider nexus got raw msg from below");
        super.onBinMessage(below_nexus, msg_bytes);
    }

    ///////////////////////////////////////////////////////////////////////////


    notifyOpinionInvoice(bolt11, request_reference_uuid) {
        //console.log("notify opinion invoce: " + bolt11 + " " +
        //            request_reference_uuid);
        this.send(new NotifyOpinionInvoice(request_reference_uuid, bolt11));
    }

    notifySellerNotReady() {
        this.send(new NotifyOpinionSellerNotReady(this.request_reference_uuid));
    }

    notifySeller() {
        var shared_seed = this.getSharedSeed();
        console.assert(this.handlesellerinforequest != null);
        var seller_info = this.handlesellerinforequest();
        console.assert(seller_info['ready']);
        var seller_uuid = seller_info['seller_uuid'];
        var items = seller_info['items'];
        console.log("sending seller info: " + seller_info);
        this.send(new NotifyOpinionSeller(seller_uuid, items,
                                          this.request_reference_uuid));
    }

    notifyOpinion(item_id, opinion, request_reference_uuid) {
        this.send(new NotifyOpinion(request_reference_uuid, item_id, opinion));
    }

    ///////////////////////////////////////////////////////////////////////////

    updatePrices() {
        this.notifySeller();
    }

    sellerNowReady() {
        this.notifySeller();
        this.seller_finished_cb(this);
    }

    waitForBuyer(seller_finished_cb) {
        this.seller_finished_cb = seller_finished_cb;
    }
}

exports.SellerNexus = SellerNexus;
