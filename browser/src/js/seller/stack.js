// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const WebsocketLocation = require(
    '../moneysocket/beacon/location/websocket.js').WebsocketLocation;
const OutgoingWebsocketLayer = require(
    "../moneysocket/protocol/websocket/outgoing_layer.js")
        .OutgoingWebsocketLayer;
const ProviderLayer = require(
    "../moneysocket/protocol/provider/layer.js").ProviderLayer;
const OutgoingRendezvousLayer = require(
    "../moneysocket/protocol/rendezvous/outgoing_layer.js")
        .OutgoingRendezvousLayer;
const ProviderTransactLayer = require(
    "../moneysocket/protocol/transact/provider_layer.js").ProviderTransactLayer;
const SellerLayer = require("../seller/layer.js").SellerLayer;


class SellerStack {
    constructor(app, ui) {
        this.app = app;
        this.ui = ui;

        console.assert(typeof app.sellerOnlineCb == 'function');
        console.assert(typeof app.sellerOfflineCb == 'function');
        console.assert(typeof app.sellerPostStackEventCb == 'function');

        console.assert(
            typeof app.sellerRequestingOpinionInvoiceCb == 'function');
        console.assert(
            typeof app.sellerRequestingOpinionSellerInfoCb == 'function');

        this.seller_layer = new SellerLayer(this, this);
        this.transact_layer = new ProviderTransactLayer(this,
                                                        this.seller_layer);
        this.provider_layer = new ProviderLayer(this, this.transact_layer);
        this.rendezvous_layer = new OutgoingRendezvousLayer(this,
            this.provider_layer);
        this.websocket_layer = new OutgoingWebsocketLayer(this,
            this.rendezvous_layer);

        this.nexus = null;
        this.shared_seed = null;
    }

    getProviderInfo(shared_seed) {
        return this.app.getProviderInfo();
    }

    providerNowReadyFromApp() {
        this.provider_layer.providerNowReadyFromApp();
    }


    sendProviderInfoUpdate() {
        if (this.nexus == null) {
            return;
        }
        var shared_seed = this.nexus.getSharedSeed();
        this.provider_layer.sendProviderInfoUpdate(shared_seed);
    }

    sellerNowReadyFromApp() {
        this.seller_layer.sellerNowReadyFromApp();
    }

    //////////////////////////////////////////////////////////////////////////
    // layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    announceNexusFromBelowCb(below_nexus) {
        console.log("provider stack got nexus");
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();
        this.app.sellerOnlineCb();
    }

    revokeNexusFromBelowCb(below_nexus) {
        console.log("provider stack got nexus revoked");
        this.nexus = null;
        this.shared_seed = null;
        this.app.sellerOfflineCb();
    }

    postLayerStackEventCb(layer_name, nexus, status) {
        this.app.sellerPostStackEventCb(layer_name, status);
    }

    ///////////////////////////////////////////////////////////////////////////
    // seller layer callbacks
    ///////////////////////////////////////////////////////////////////////////

    getOpinionInvoiceCb(item_id, request_uuid) {
        return this.app.sellerRequestingOpinionInvoiceCb(item_id, request_uuid);
    }

    fulfilRequestOpinionInvoiceCb(bolt11, request_reference_uuid) {
        this.nexus.notifyOpinionInvoice(bolt11, request_reference_uuid);
    }

    getOpinionSellerInfoCb() {
        return this.app.sellerRequestingOpinionSellerInfoCb();
    }

    fulfilOpinion(item_id, opinion, request_reference_uuid) {
        this.nexus.notifyOpinion(item_id, opinion, request_reference_uuid);
    }

    ///////////////////////////////////////////////////////////////////////////
    // transact layer allbacks
    ///////////////////////////////////////////////////////////////////////////

    gotRequestInvoiceCb(msats, request_uuid) {
        // TODO - error?
    }

    gotRequestPayCb(bolt11, request_uuid) {
        // TODO - error?
    }

    //////////////////////////////////////////////////////////////////////////
    // UI calls these:
    //////////////////////////////////////////////////////////////////////////

    doConnect(beacon) {
        console.log("provider layer connect called");

        var location = beacon.locations[0];
        var shared_seed = beacon.getSharedSeed();
        if (! (location instanceof WebsocketLocation)) {
            console.error("not websocket location?");
            return;
        }
        console.log("connect provider: " + location.toWsUrl());
        this.websocket_layer.connect(location, shared_seed);
    }

    doDisconnect() {
        console.log("provider layer disconnect called");
        this.websocket_layer.initiateCloseAll();
    }
}

exports.SellerStack = SellerStack;
