// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const WebsocketLocation = require(
    '../beacon/location/websocket.js').WebsocketLocation;

const OutgoingWebsocketLayer = require(
    "../protocol/websocket/outgoing_layer.js").OutgoingWebsocketLayer;
const OutgoingRendezvousLayer = require(
    "../protocol/rendezvous/outgoing_layer.js").OutgoingRendezvousLayer;
const ConsumerLayer = require("../protocol/consumer/layer.js").ConsumerLayer;
const ConsumerTransactLayer = require(
    "../protocol/transact/consumer_layer.js").ConsumerTransactLayer;

class ConsumerStack {
    constructor() {

        this.onnexusonline = null;
        this.onnexusoffline = null;
        this.onproviderinfo = null;
        this.onstackevent = null;
        this.onping = null;
        this.onbolt11 = null;
        this.onpreimage = null;

        this.transact_layer = this.setupConsumerTransactLayer(this);
        this.consumer_layer = this.setupConsumerLayer(this.transact_layer);
        this.rendezvous_layer = this.setupOutgoingRendezvousLayer(
            this.consumer_layer);
        this.websocket_layer = this.setupOutgoingWebsocketLayer(
            this.rendezvous_layer);

        this.nexus = null;
    }


    //////////////////////////////////////////////////////////////////////////
    // setup
    //////////////////////////////////////////////////////////////////////////

    setupConsumerTransactLayer(above_layer) {
        var l = new ConsumerTransactLayer(this, above_layer);
        l.onlayerevent = (function(layer_name, nexus, status) {
            this.onLayerEvent(layer_name, nexus, status);
        }).bind(this);
        l.onbolt11 = (function(nexus, bolt11, request_reference_uuid) {
            this.onBolt11(nexus, bolt11, request_reference_uuid);
        }).bind(this);
        l.onpreimage = (function(nexus, preimage, request_reference_uuid) {
            this.onPreimage(nexus, preimage, request_reference_uuid);
        }).bind(this);
        return l;
    }

    setupConsumerLayer(above_layer) {
        var l = new ConsumerLayer(this, above_layer);
        l.onlayerevent = (function(layer_name, nexus, status) {
            this.onLayerEvent(layer_name, nexus, status);
        }).bind(this);
        l.onproviderinfo = (function(nexus, msg) {
            this.onProviderInfo(nexus, msg);
        }).bind(this);
        l.onping = (function(nexus, msecs) {
            this.onPing(nexus, msecs);
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
    // transact layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    onBolt11(transact_nexus, bolt11, request_reference_uuid) {
        if (this.onbolt11 != null) {
            this.onbolt11(bolt11, request_reference_uuid);
        }
    }

    onPreimage(transact_nexus, preimage, request_reference_uuid) {
        if (this.onpreimage != null) {
            this.onpreimage(preimage, request_reference_uuid);
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // consumer layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    onProviderInfo(consumer_nexus, msg) {
        var provider_info = {'payer':         msg['payer'],
                             'payee':         msg['payee'],
                             'wad':           msg['wad'],
                             'account_uuid':  msg['account_uuid']};
        if (this.onproviderinfo != null) {
            this.onproviderinfo(provider_info);
        }
    }

    onPing(consumer_nexus, msecs) {
        if (this.onping != null) {
            this.onping(msecs);
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    announceNexusFromBelowCb(below_nexus) {
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();

        if (this.onnexusonline != null) {
            this.onnexusonline(below_nexus);
        }
    }

    revokeNexusFromBelowCb(below_nexus) {
        console.log("consumer stack got nexus revoked");
        this.nexus = null;
        this.shared_seed = null;

        if (this.onnexusoffline != null) {
            this.onnexusoffline(below_nexus);
        }
    }

    onLayerEvent(layer_name, nexus, status) {
        if (this.onstackevent != null) {
            this.onstackevent(layer_name, nexus, status);
        }
    }

    //////////////////////////////////////////////////////////////////////////
    // UI calls these
    //////////////////////////////////////////////////////////////////////////

    doConnect(beacon) {
        console.log("consumer stack connect called");

        var location = beacon.locations[0];
        var shared_seed = beacon.getSharedSeed();
        if (! (location instanceof WebsocketLocation)) {
            console.error("not websocket location?");
            return;
        }
        console.log("connect consumer: " + location.toWsUrl());
        this.websocket_layer.connect(location, shared_seed)
    }

    doDisconnect() {
        console.log("consumer stack disconnect called");
        this.websocket_layer.initiateCloseAll();
    }

    requestInvoice(msats, override_request_uuid, description) {
        this.nexus.requestInvoice(msats, override_request_uuid, description);
    }

    requestPay(bolt11, override_request_uuid) {
        this.nexus.requestPay(bolt11, override_request_uuid);
    }

}


exports.ConsumerStack = ConsumerStack;
