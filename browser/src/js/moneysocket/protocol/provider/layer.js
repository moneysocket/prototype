// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolLayer =  require("../layer.js").ProtocolLayer;
const ProviderNexus = require("./nexus.js").ProviderNexus;



class ProviderLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer, "PROVIDER");
        console.assert(typeof stack.getProviderInfo == 'function');
        this.waiting_for_app = {};
        this.nexus_by_shared_seed = {};
    }

    announceNexusFromBelowCb(below_nexus) {
        var provider_nexus = new ProviderNexus(below_nexus, this);
        this._trackNexus(provider_nexus, below_nexus);

        var shared_seed_str = provider_nexus.getSharedSeed().toString();
        this.nexus_by_shared_seed[shared_seed_str] = provider_nexus;

        this.notifyAppOfStatus(provider_nexus, "NEXUS_WAITING");
        provider_nexus.waitForConsumer(this.providerFinishedCb.bind(this));
    }

    providerFinishedCb(provider_nexus) {
        this._trackNexusAnnounced(provider_nexus);
        this.notifyAppOfStatus(provider_nexus, "NEXUS_ANNOUNCED");
        this.announceNexusAboveCb(provider_nexus);
    }

    revokeNexusFromBelowCb(below_nexus) {
        var provider_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexusFromBelowCb(below_nexus);
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

    sendProviderInfoUpdate(shared_seed) {
        var shared_seed_str = shared_seed.toString();
        if (shared_seed_str in this.nexus_by_shared_seed) {
            var provider_nexus = this.nexus_by_shared_seed[shared_seed_str];
            provider_nexus.notifyProvider();
        }
    }
}


exports.ProviderLayer = ProviderLayer;
