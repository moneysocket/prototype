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

        this.onnexusonline = null;
        this.onnexusoffline = null;
        this.onstackevent = null;
        this.handleinvoicerequest = null;
        this.handlepayrequest = null;
        this.handleproviderinforequest = null;
        this.handleopinioninvoicerequest = null;
        this.handlesellerinforequest = null;

        this.websocket_layer = this.setupOutgoingWebsocketLayer();
        this.rendezvous_layer = this.setupOutgoingRendezvousLayer(
            this.websocket_layer);
        this.provider_layer = this.setupProviderLayer(this.rendezvous_layer);
        this.transact_layer = this.setupProviderTransactLayer(
            this.provider_layer);
        this.seller_layer = this.setupSellerLayer(this.transact_layer);

        this.seller_layer.onnexusonline = (function(nexus) {
            this.announceNexus(nexus);
        }).bind(this);
        this.seller_layer.onnexusoffline = (function(nexus) {
            this.revokeNexus(nexus);
        }).bind(this);

        this.nexus = null;
        this.shared_seed = null;
    }

    //////////////////////////////////////////////////////////////////////////
    // setup
    //////////////////////////////////////////////////////////////////////////

    setupSellerLayer(below_layer) {
        var l = new SellerLayer();
        l.onlayerevent = (function(nexus, status) {
            this.onLayerEvent("SELLER", nexus, status);
        }).bind(this);
        l.handleopinioninvoicerequest = (function(nexus, msats, request_uuid) {
           this.handleOpinionInvoiceRequest(msats, request_uuid);
        }).bind(this);
        l.handlesellerinforequest = (function() {
           return this.handleSellerInfoRequest();
        }).bind(this);
        l.registerAboveLayer(below_layer);
        return l;
    }

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

    sellerNowReadyFromApp() {
        this.seller_layer.sellerNowReadyFromApp();
    }

    updatePrices() {
        this.nexus.updatePrices();
    }

    //////////////////////////////////////////////////////////////////////////
    // layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    announceNexus(below_nexus) {
        console.log("provider stack got nexus");
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();

        if (this.onnnexusonline != null) {
            this.onnexusonline(below_nexus);
        }
    }

    revokeNexus(below_nexus) {
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

    ///////////////////////////////////////////////////////////////////////////
    // seller layer callbacks
    ///////////////////////////////////////////////////////////////////////////

    handleOpinionInvoiceRequest(item_id, request_uuid) {
        this.handleopinioninvoicerequest(item_id, request_uuid);
    }

    fulfilOpinionInvoiceRequest(bolt11, request_reference_uuid) {
        this.nexus.notifyOpinionInvoice(bolt11, request_reference_uuid);
    }

    handleSellerInfoRequest() {
        return this.handlesellerinforequest();
    }

    fulfilOpinion(item_id, opinion, request_reference_uuid) {
        this.nexus.notifyOpinion(item_id, opinion, request_reference_uuid);
    }

    ///////////////////////////////////////////////////////////////////////////
    // transact layer allbacks
    ///////////////////////////////////////////////////////////////////////////

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
