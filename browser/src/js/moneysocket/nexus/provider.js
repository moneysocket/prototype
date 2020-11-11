// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Nexus = require("./nexus.js").Nexus;

const NotifyPong = require("../message/notification/pong.js").NotifyPong;
const NotifyProviderNotReady = require(
    "../message/notification/provider_not_ready.js").NotifyProviderNotReady;
const NotifyProvider = require(
    "../message/notification/provider.js").NotifyProvider;


const LAYER_REQUESTS = new Set(["REQUEST_PROVIDER",
                                "REQUEST_PING",
                               ]);


class ProviderNexus extends Nexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);
        this.provider_finished_cb = null;
        this.request_reference_uuid = null;

        this.handleproviderinforequest = null;
    }

    ///////////////////////////////////////////////////////////////////////////

    isLayerMessage(msg) {
        if (msg['message_class'] != "REQUEST") {
            return false;
        }
        return LAYER_REQUESTS.has(msg['request_name']);
    }

    onMessage(below_nexus, msg) {
        //console.log("provider nexus got msg from below");
        if (! this.isLayerMessage(msg)) {
            super.onMessage(below_nexus, msg)
            return;
        }
        this.request_reference_uuid = msg['request_uuid'];
        if (msg['request_name'] == "REQUEST_PROVIDER") {
            var shared_seed = below_nexus.getSharedSeed();
            console.assert(this.handleproviderinforequest != null);
            var provider_info = this.handleproviderinforequest();
            console.log("provider info: " + JSON.stringify(provider_info));
            if (provider_info['ready']) {
                this.notifyProvider();
                this.provider_finished_cb(this);
            } else {
                this.notifyProviderNotReady();
                this.layer.nexusWaitingForApp(shared_seed, this);
            }
        } else if (msg['request_name'] == "REQUEST_PING") {
            this.notifyPong();
        }
    }

    onBinMessage(below_nexus, msg_bytes) {
        //console.log("provider nexus got raw msg from below");
        super.onBinMessage(below_nexus, msg_bytes);
    }

    ///////////////////////////////////////////////////////////////////////////

    notifyPong() {
        this.send(new NotifyPong(this.request_reference_uuid));
    }

    notifyProviderNotReady() {
        this.send(new NotifyProviderNotReady(this.request_reference_uuid));
    }

    notifyProvider() {
        var shared_seed = this.getSharedSeed();
        console.assert(this.handleproviderinforequest != null);
        var provider_info = this.handleproviderinforequest(shared_seed);
        console.assert(provider_info['ready']);
        var account_uuid = provider_info['account_uuid'];
        var payer = provider_info['payer'];
        var payee = provider_info['payee'];
        var wad = provider_info['wad'];

        this.send(new NotifyProvider(account_uuid, this.request_reference_uuid,
                                     payer, payee, wad));

    }

    ///////////////////////////////////////////////////////////////////////////

    providerNowReady() {
        this.notifyProvider();
        this.provider_finished_cb(this);
    }

    waitForConsumer(provider_finished_cb) {
        this.provider_finished_cb = provider_finished_cb;
    }
}

exports.ProviderNexus = ProviderNexus;
