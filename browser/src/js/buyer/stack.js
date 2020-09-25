// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const WebsocketLocation = require(
    '../moneysocket/beacon/location/websocket.js').WebsocketLocation;

const OutgoingWebsocketLayer = require(
    "../moneysocket/protocol/websocket/outgoing_layer.js")
        .OutgoingWebsocketLayer;
const OutgoingRendezvousLayer = require(
    "../moneysocket/protocol/rendezvous/outgoing_layer.js")
        .OutgoingRendezvousLayer;
const ConsumerLayer = require(
    "../moneysocket/protocol/consumer/layer.js").ConsumerLayer;
const ConsumerTransactLayer = require(
    "../moneysocket/protocol/transact/consumer_layer.js").ConsumerTransactLayer;
const BuyerLayer = require("../buyer/layer.js").BuyerLayer;

class BuyerStack {
    constructor(app) {
        this.app = app;

        console.assert(typeof app.buyerOnlineCb == 'function');
        console.assert(typeof app.buyerOfflineCb == 'function');
        console.assert(typeof app.buyerReportProviderInfoCb == 'function');
        console.assert(typeof app.buyerReportPingCb == 'function');
        console.assert(typeof app.buyerPostStackEventCb == 'function');

        console.assert(typeof app.buyerReportBolt11Cb == 'function');
        console.assert(typeof app.buyerReportPreimageCb == 'function');

        console.assert(typeof app.buyerReportSellerInfoCb == 'function');
        console.assert(typeof app.buyerReportOpinionInvoiceCb == 'function');
        console.assert(typeof app.buyerReportOpinionCb == 'function');

        this.buyer_layer = new BuyerLayer(this, this);
        this.transact_layer = new ConsumerTransactLayer(this, this.buyer_layer);
        this.consumer_layer = new ConsumerLayer(this, this.transact_layer);
        this.rendezvous_layer = new OutgoingRendezvousLayer(
            this, this.consumer_layer);
        this.websocket_layer = new OutgoingWebsocketLayer(
            this, this.rendezvous_layer);

    }
    //////////////////////////////////////////////////////////////////////////
    // buyer layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    gotOpinionInvoiceCb(buyer_nexus, bolt11, request_reference_uuid) {
        this.app.buyerReportOpinionInvoiceCb(bolt11, request_reference_uuid);
    }

    gotOpinionCb(buyer_nexus, item_id, opinion) {
        this.app.buyerReportOpinionCb(item_id, opinion);
    }

    gotSellerCb(buyer_nexus, seller_info) {
        this.app.buyerReportSellerInfoCb(seller_info);
    }

    //////////////////////////////////////////////////////////////////////////
    // transact layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    notifyInvoiceCb(transact_nexus, bolt11, request_reference_uuid) {
        this.app.buyerReportBolt11Cb(bolt11, request_reference_uuid);
    }

    notifyPreimageCb(transact_nexus, preimage, request_reference_uuid) {
        this.app.buyerReportPreimageCb(preimage, request_reference_uuid);
    }

    //////////////////////////////////////////////////////////////////////////
    // consumer layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    notifyProviderCb(consumer_nexus, msg) {
        var provider_info = {'payer':         msg['payer'],
                             'payee':         msg['payee'],
                             'msats':         msg['msats'],
                             'provider_uuid': msg['provider_uuid']};
        this.app.buyerReportProviderInfoCb(provider_info);
    }

    notifyPingCb(consumer_nexus, msecs) {
        this.app.buyerReportPingCb(msecs);
    }

    //////////////////////////////////////////////////////////////////////////
    // layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    announceNexusFromBelowCb(below_nexus) {
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();
        this.app.buyerOnlineCb();
    }

    revokeNexusFromBelowCb(below_nexus) {
        this.nexus = null;
        this.shared_seed = null;
        this.app.buyerOfflineCb();
    }

    postLayerStackEventCb(layer_name, nexus, status) {
        this.app.buyerPostStackEventCb(layer_name, status);
    }

    //////////////////////////////////////////////////////////////////////////
    // UI calls these
    //////////////////////////////////////////////////////////////////////////

    doConnect(beacon) {
        console.log("buyer stack connect called");

        var location = beacon.locations[0];
        var shared_seed = beacon.getSharedSeed();
        if (! (location instanceof WebsocketLocation)) {
            console.error("not websocket location?");
            return;
        }
        console.log("connect buyer: " + location.toWsUrl());
        this.websocket_layer.connect(location, shared_seed)
    }

    doDisconnect() {
        console.log("buyer stack disconnect called");
        this.websocket_layer.initiateCloseAll();
    }

    /*
    requestInvoice(msats, override_request_uuid) {
        this.nexus.requestInvoice(msats, override_request_uuid);
    }

    requestPay(bolt11, override_request_uuid) {
        this.nexus.requestPay(bolt11, override_request_uuid);
    }
    */

    buyItem(item_id) {
        this.nexus.requestOpinionInvoice(item_id);
    }

}


exports.BuyerStack = BuyerStack;
