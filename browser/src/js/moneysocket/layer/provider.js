// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Layer = require("./layer.js").Layer;
const ProviderNexus = require("../nexus/provider.js").ProviderNexus;

class ProviderLayer extends Layer {
    constructor() {
        super();
        this.handleproviderinforequest = null;

        this.waiting_for_app = {};
        this.nexus_by_shared_seed = {};
    }

    setupProviderNexus(below_nexus) {
        var n = new ProviderNexus(below_nexus, this);
        n.handleproviderinforequest = (function() {
            return this.handleProviderInfoRequest();
        }).bind(this);
        return n;
    }

    ///////////////////////////////////////////////////////////////////////////

    announceNexus(below_nexus) {
        var provider_nexus = this.setupProviderNexus(below_nexus);
        this._trackNexus(provider_nexus, below_nexus);

        var shared_seed_str = provider_nexus.getSharedSeed().toString();
        this.nexus_by_shared_seed[shared_seed_str] = provider_nexus;

        this.sendLayerEvent(provider_nexus, "NEXUS_WAITING");
        provider_nexus.waitForConsumer(this.providerFinishedCb.bind(this));
    }

    providerFinishedCb(provider_nexus) {
        this._trackNexusAnnounced(provider_nexus);
        this.sendLayerEvent(provider_nexus, "NEXUS_ANNOUNCED");
        if (this.onannounce != null) {
            this.onannounce(provider_nexus);
        }
    }

    revokeNexus(below_nexus) {
        var provider_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexus(below_nexus);
        var shared_seed_str = provider_nexus.getSharedSeed().toString();
        delete this.waiting_for_app[shared_seed_str];
        delete this.nexus_by_shared_seed[shared_seed_str];
    }

    nexusWaitingForApp(shared_seed, provider_nexus) {
        // Nexus is letting us know it can't finish the handshake until
        // the app is ready.
        var shared_seed_str = shared_seed.toString();
        this.waiting_for_app[shared_seed_str] = provider_nexus;
    }

    providerNowReadyFromApp() {
        for (var shared_seed_str in this.waiting_for_app) {
            var provider_nexus = this.waiting_for_app[shared_seed_str];
            delete this.waiting_for_app[shared_seed_str];
            provider_nexus.providerNowReady();
        }
    }

    handleProviderInfoRequest(shared_seed) {
        console.assert(this.handleproviderinforequest != null);
        return this.handleproviderinforequest(shared_seed);
    }

    sendProviderInfoUpdate(shared_seed) {
        var shared_seed_str = shared_seed.toString();
        if (shared_seed_str in this.nexus_by_shared_seed) {
            var provider_nexus = this.nexus_by_shared_seed[shared_seed_str];
            provider_nexus.notifyProvider();
        }
    }
}


exports.ProviderLayer = ProviderLayer;
