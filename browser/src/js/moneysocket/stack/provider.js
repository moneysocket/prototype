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

    postLayerStackEventCb(layer_name, nexus, status) {
        if (this.onstackevent != null) {
            this.onstackevent(layer_name, nexus, status);
        }
    }

    gotRequestInvoiceCb(msats, request_uuid) {
        if (this.handleinvoicerequest != null) {
            this.handleinvoicerequest(mstats, request_uuid);
        }
    }

    fulfilRequestInvoice(bolt11, request_reference_uuid) {
        this.nexus.notifyInvoice(bolt11, request_reference_uuid);
    }

    gotRequestPayCb(bolt11, request_uuid) {
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
