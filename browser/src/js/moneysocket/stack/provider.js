// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const WebsocketLocation = require(
    '../beacon/location/websocket.js').WebsocketLocation;
const OutgoingWebsocketLayer = require(
    "../layer/outgoing_websocket.js").OutgoingWebsocketLayer;
const ProviderLayer = require("../layer/provider.js").ProviderLayer;
const OutgoingRendezvousLayer = require(
    "../layer/outgoing_rendezvous.js").OutgoingRendezvousLayer;
const ProviderTransactLayer = require(
    "../layer/provider_transact.js").ProviderTransactLayer;


class ProviderStack {
    constructor() {
        this.onannounce = null;
        this.onrevoke = null;
        this.onstackevent = null;
        this.handleinvoicerequest = null;
        this.handlepayrequest = null;
        this.handleproviderinforequest = null;

        this.websocket_layer = this.setupOutgoingWebsocketLayer();
        this.rendezvous_layer = this.setupOutgoingRendezvousLayer(
            this.websocket_layer);
        this.provider_layer = this.setupProviderLayer(this.rendezvous_layer);
        this.transact_layer = this.setupProviderTransactLayer(
            this.provider_layer);

        this.transact_layer.onannounce = (function(nexus) {
            this.announceNexus(nexus);
        }).bind(this);
        this.transact_layer.onrevoke = (function(nexus) {
            this.revokeNexus(nexus);
        }).bind(this);

        this.nexus = null;
        this.shared_seed = null;
    }

    //////////////////////////////////////////////////////////////////////////
    // setup
    //////////////////////////////////////////////////////////////////////////

    setupProviderTransactLayer(below_layer) {
        var l = new ProviderTransactLayer();
        l.onlayerevent = (function(nexus, status) {
            this.onLayerEvent("PROVIDER_TRANSACT", nexus, status);
        }).bind(this);
        l.handleinvoicerequest = (function(nexus, msats, request_uuid) {
            this.handleInvoiceRequest(msats, request_uuid);
        }).bind(this);
        l.handlepayrequest = (function(nexus, msats, request_uuid) {
            this.handlePayRequest(msats, request_uuid);
        }).bind(this);
        l.registerAboveLayer(below_layer);
        return l;
    }

    setupProviderLayer(below_layer) {
        var l = new ProviderLayer();
        l.onlayerevent = (function(nexus, status) {
            this.onLayerEvent("PROVIDER", nexus, status);
        }).bind(this);
        l.handleproviderinforequest = (function(shared_seed) {
            return this.handleProviderInfoRequest(shared_seed);
        }).bind(this);
        l.registerAboveLayer(below_layer);
        return l;
    }

    setupOutgoingRendezvousLayer(below_layer) {
        var l = new OutgoingRendezvousLayer();
        l.onlayerevent = (function(nexus, status) {
            this.onLayerEvent("OUTGOING_RENDEZVOUS", nexus, status);
        }).bind(this);
        l.registerAboveLayer(below_layer);
        return l;
    }

    setupOutgoingWebsocketLayer() {
        var l = new OutgoingWebsocketLayer();
        l.onlayerevent = (function(nexus, status) {
            this.onLayerEvent("OUTGOING_WEBSOCKET", nexus, status);
        }).bind(this);
        return l;
    }

    //////////////////////////////////////////////////////////////////////////

    handleProviderInfoRequest(shared_seed) {
        console.assert(this.handleproviderinforequest != null);
        return this.handleproviderinforequest();
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

    announceNexus(below_nexus) {
        console.log("provider stack got nexus");
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();

        if (this.onannounce != null) {
            this.onannounce(below_nexus);
        }
    }

    revokeNexus(below_nexus) {
        console.log("provider stack got nexus revoked");
        this.nexus = null;
        this.shared_seed = null;

        if (this.onrevoke != null) {
            this.onrevoke(below_nexus);
        }
    }

    onLayerEvent(layer_name, nexus, status) {
        if (this.onstackevent != null) {
            this.onstackevent(layer_name, nexus, status);
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // transact layer invoice request
    //////////////////////////////////////////////////////////////////////////

    handleInvoiceRequest(msats, request_uuid) {
        if (this.handleinvoicerequest != null) {
            this.handleinvoicerequest(mstats, request_uuid);
        }
    }

    fulfilRequestInvoice(bolt11, request_reference_uuid) {
        this.nexus.notifyInvoice(bolt11, request_reference_uuid);
    }

    handlePayRequest(bolt11, request_uuid) {
        if (this.handlepayrequest != null) {
            this.handlepayrequest(bolt11, request_uuid);
        }
    }

    fulfilRequestPay(preimage, request_reference_uuid) {
        this.nexus.notifyPreimage(preimage, request_reference_uuid);
    }

    //////////////////////////////////////////////////////////////////////////
    // UI calls these:
    //////////////////////////////////////////////////////////////////////////

    doConnect(beacon) {
        //console.log("provider layer connect called");

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
        //console.log("provider layer disconnect called");
        this.websocket_layer.initiateCloseAll();
    }
}

exports.ProviderStack = ProviderStack;
