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
    constructor(app) {
        this.app = app;

        console.assert(typeof app.consumerOnlineCb == 'function');
        console.assert(typeof app.consumerOfflineCb == 'function');
        console.assert(typeof app.consumerReportProviderInfoCb == 'function');
        console.assert(typeof app.consumerReportPingCb == 'function');
        console.assert(typeof app.consumerPostStackEventCb == 'function');

        console.assert(typeof app.consumerReportBolt11Cb == 'function');
        console.assert(typeof app.consumerReportPreimageCb == 'function');

        this.transact_layer = new ConsumerTransactLayer(this, this);
        this.consumer_layer = new ConsumerLayer(this, this.transact_layer);
        this.rendezvous_layer = new OutgoingRendezvousLayer(
            this, this.consumer_layer);
        this.websocket_layer = new OutgoingWebsocketLayer(
            this, this.rendezvous_layer);

    }

    //////////////////////////////////////////////////////////////////////////
    // transact layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    notifyInvoiceCb(transact_nexus, bolt11, request_reference_uuid) {
        this.app.consumerReportBolt11Cb(bolt11, request_reference_uuid);
    }

    notifyPreimageCb(transact_nexus, preimage, request_reference_uuid) {
        this.app.consumerReportPreimageCb(preimage, request_reference_uuid);
    }

    //////////////////////////////////////////////////////////////////////////
    // consumer layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    notifyProviderCb(consumer_nexus, msg) {
        var provider_info = {'payer':         msg['payer'],
                             'payee':         msg['payee'],
                             'msats':         msg['msats'],
                             'provider_uuid': msg['provider_uuid']};
        this.app.consumerReportProviderInfoCb(provider_info);
    }

    notifyPingCb(consumer_nexus, msecs) {
        this.app.consumerReportPingCb(msecs);
    }

    //////////////////////////////////////////////////////////////////////////
    // layer callbacks:
    //////////////////////////////////////////////////////////////////////////

    announceNexusFromBelowCb(below_nexus) {
        this.nexus = below_nexus;
        this.shared_seed = below_nexus.getSharedSeed();
        //this.nexus.startPinging();

        console.log("consumer stack got nexus");
        this.app.consumerOnlineCb();
    }

    revokeNexusFromBelowCb(below_nexus) {
        console.log("consumer stack got nexus revoked");
        //this.nexus.stopPinging();
        this.nexus = null;
        this.shared_seed = null;
        this.app.consumerOfflineCb();
    }

    postLayerStackEventCb(layer_name, nexus, status) {
        this.app.consumerPostStackEventCb(layer_name, status);
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
