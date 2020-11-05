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
    constructor() {
        this.onnexusonline = null;
        this.onnexusoffline = null;
        this.onstackevent = null;
        this.handleinvoicerequest = null;
        this.handlepayrequest = null;
        this.handleproviderinforequest = null;

        this.transact_layer = this.setupProviderTransactLayer(this);
        this.provider_layer = this.setupProviderLayer(this.transact_layer);
        this.rendezvous_layer = this.setupOutgoingRendezvousLayer(
            this.provider_layer);
        this.websocket_layer = this.setupOutgoingWebsocketLayer(
            this.rendezvous_layer);

        this.nexus = null;
        this.shared_seed = null;
    }

    //////////////////////////////////////////////////////////////////////////
    // setup
    //////////////////////////////////////////////////////////////////////////

    setupProviderTransactLayer(above_layer) {
        var l = new ProviderTransactLayer(this, above_layer);
        l.onlayerevent = (function(layer_name, nexus, status) {
            this.onLayerEvent(layer_name, nexus, status);
        }).bind(this);
        l.handleinvoicerequest = (function(nexus, msats, request_uuid) {
            this.handleInvoiceRequest(msats, request_uuid);
        }).bind(this);
        l.handlepayrequest = (function(nexus, msats, request_uuid) {
            this.handlePayRequest(msats, request_uuid);
        }).bind(this);
        return l;
    }

    setupProviderLayer(above_layer) {
        var l = new ProviderLayer(this, above_layer);
        l.onlayerevent = (function(layer_name, nexus, status) {
            this.onLayerEvent(layer_name, nexus, status);
        }).bind(this);
        l.handleproviderinforequest = (function(shared_seed) {
            return this.handleProviderInfoRequest(shared_seed);
        }).bind(this);
        return l;
    }

    setupOutgoingRendezvousLayer(above_layer) {
        var l = new OutgoingRendezvousLayer(this, above_layer);
        l.onlayerevent = (function(layer_name, nexus, status) {
            this.onLayerEvent(layer_name, nexus, status);
        }).bind(this);
        return l;
    }

    setupOutgoingWebsocketLayer(above_layer) {
        var l = new OutgoingWebsocketLayer(this, above_layer);
        l.onlayerevent = (function(layer_name, nexus, status) {
            this.onLayerEvent(layer_name, nexus, status);
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

    announceNexusFromBelowCb(below_nexus) {
        console.log("provider stack got nexus");
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();

        if (this.onnnexusonline != null) {
            this.onnexusonline(below_nexus);
        }
    }

    revokeNexusFromBelowCb(below_nexus) {
        console.log("provider stack got nexus revoked");
        this.nexus = null;
        this.shared_seed = null;

        if (this.onnnexusoffline != null) {
            this.onnexusoffline(below_nexus);
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
