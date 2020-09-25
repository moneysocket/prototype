// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const WebsocketLocation = require(
    '../beacon/location/websocket.js').WebsocketLocation;
const OutgoingWebsocketLayer = require(
    "../protocol/websocket/outgoing_layer.js").OutgoingWebsocketLayer;
const ProviderLayer = require(
    "../protocol/provider/layer.js").ProviderLayer;
const OutgoingRendezvousLayer = require(
    "../protocol/rendezvous/outgoing_layer.js").OutgoingRendezvousLayer;
const ProviderTransactLayer = require(
    "../protocol/transact/provider_layer.js").ProviderTransactLayer;


class ProviderStack {
    constructor(app, ui) {
        this.app = app;
        this.ui = ui;

        console.assert(typeof app.providerOnlineCb == 'function');
        console.assert(typeof app.providerOfflineCb == 'function');
        console.assert(typeof app.providerPostStackEventCb == 'function');

        console.assert(typeof app.providerRequestingInvoiceCb == 'function');
        console.assert(typeof app.providerRequestingPayCb == 'function');

        this.transact_layer = new ProviderTransactLayer(this, this);
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

    //////////////////////////////////////////////////////////////////////////
    // layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    announceNexusFromBelowCb(below_nexus) {
        console.log("provider stack got nexus");
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();
        this.app.providerOnlineCb();
    }

    revokeNexusFromBelowCb(below_nexus) {
        console.log("provider stack got nexus revoked");
        this.nexus = null;
        this.shared_seed = null;
        this.app.providerOfflineCb();
    }

    postLayerStackEventCb(layer_name, nexus, status) {
        this.app.providerPostStackEventCb(layer_name, status);
    }


    gotRequestInvoiceCb(msats, request_uuid) {
        // connected consumer is asking for an invoice, hand to app,
        this.app.providerRequestingInvoiceCb(msats, request_uuid);
    }

    fulfilRequestInvoice(bolt11, request_reference_uuid) {
        // a bolt11 has been provided from the app from previous request
        this.nexus.notifyInvoice(bolt11, request_reference_uuid);
    }

    gotRequestPayCb(bolt11, request_uuid) {
        // connected consumer is asking for bolt11 to be paid, hand to app
        this.app.providerRequestingPayCb(bolt11, request_uuid);
    }

    fulfilRequestPay(preimage, request_reference_uuid) {
        // a preimage has been provided from the app from previous pay request
        this.nexus.notifyPreimage(preimage, request_reference_uuid);
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

exports.ProviderStack = ProviderStack;
