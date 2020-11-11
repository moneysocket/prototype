// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const WebsocketLocation = require(
    '../beacon/location/websocket.js').WebsocketLocation;

const OutgoingWebsocketLayer = require(
    "../layer/outgoing_websocket.js").OutgoingWebsocketLayer;
const OutgoingRendezvousLayer = require(
    "../layer/outgoing_rendezvous.js").OutgoingRendezvousLayer;
const ConsumerLayer = require("../layer/consumer.js").ConsumerLayer;
const ConsumerTransactLayer = require(
    "../layer/consumer_transact.js").ConsumerTransactLayer;

class ConsumerStack {
    constructor() {
        this.onannounce = null;
        this.onrevoke = null;
        this.onproviderinfo = null;
        this.onstackevent = null;
        this.onping = null;
        this.oninvoice = null;
        this.onpreimage = null;

        this.websocket_layer = this.setupOutgoingWebsocketLayer(null);
        this.rendezvous_layer = this.setupOutgoingRendezvousLayer(
            this.websocket_layer);
        this.consumer_layer = this.setupConsumerLayer(this.rendezvous_layer);
        this.transact_layer = this.setupConsumerTransactLayer(
            this.consumer_layer);

        this.transact_layer.onannounce = (function(nexus) {
            this.announceNexus(nexus);
        }).bind(this);
        this.transact_layer.onrevoke = (function(nexus) {
            this.revokeNexus(nexus);
        }).bind(this);

        this.nexus = null;
    }


    //////////////////////////////////////////////////////////////////////////
    // setup
    //////////////////////////////////////////////////////////////////////////

    setupConsumerTransactLayer(below_layer) {
        var l = new ConsumerTransactLayer();
        l.onlayerevent = (function(nexus, status) {
            this.onLayerEvent("CONSUMER_TRANSACT", nexus, status);
        }).bind(this);
        l.oninvoice = (function(nexus, bolt11, request_reference_uuid) {
            this.onInvoice(nexus, bolt11, request_reference_uuid);
        }).bind(this);
        l.onpreimage = (function(nexus, preimage, request_reference_uuid) {
            this.onPreimage(nexus, preimage, request_reference_uuid);
        }).bind(this);
        l.registerAboveLayer(below_layer);
        return l;
    }

    setupConsumerLayer(below_layer) {
        var l = new ConsumerLayer();
        l.onlayerevent = (function(nexus, status) {
            this.onLayerEvent("CONSUMER", nexus, status);
        }).bind(this);
        l.onproviderinfo = (function(nexus, msg) {
            this.onProviderInfo(nexus, msg);
        }).bind(this);
        l.onping = (function(nexus, msecs) {
            this.onPing(nexus, msecs);
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
    // transact layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    onInvoice(transact_nexus, bolt11, request_reference_uuid) {
        if (this.oninvoice != null) {
            this.oninvoice(bolt11, request_reference_uuid);
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

    announceNexus(below_nexus) {
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();

        if (this.onannounce != null) {
            this.onannounce(below_nexus);
        }
    }

    revokeNexus(below_nexus) {
        console.log("consumer stack got nexus revoked");
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
