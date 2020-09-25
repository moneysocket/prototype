// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php



const ProtocolLayer = require(
    "../moneysocket/protocol/layer.js").ProtocolLayer;
const SellerNexus = require("./nexus.js").SellerNexus;


class SellerLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer, "SELLER");
        console.assert(
            typeof this.stack.getOpinionInvoiceCb == 'function');
        console.assert(
            typeof this.stack.getOpinionSellerInfoCb == 'function');
        this.waiting_for_app = {};
        this.nexus_by_shared_seed = {};
    }

    announceNexusFromBelowCb(below_nexus) {
        console.log("buyer layer got nexus, starting handshake");
        var seller_nexus = new SellerNexus(below_nexus, this);
        this._trackNexus(seller_nexus, below_nexus);

        this.notifyAppOfStatus(seller_nexus, "NEXUS_WAITING");
        seller_nexus.waitForBuyer(this.sellerFinishedCb.bind(this));
    }

    sellerFinishedCb(seller_nexus) {
        this._trackNexusAnnounced(seller_nexus);
        this.notifyAppOfStatus(seller_nexus, "NEXUS_ANNOUNCED");
        this.announceNexusAboveCb(seller_nexus);
    }

    revokeNexusFromBelowCb(below_nexus) {
        var seller_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexusFromBelowCb(below_nexus);

        var shared_seed_str = seller_nexus.getSharedSeed().toString();
        delete this.waiting_for_app[shared_seed_str];
        delete this.nexus_by_shared_seed[shared_seed_str];
    }

    nexusWaitingForApp(shared_seed, seller_nexus) {
        console.log("--- waiting for app");
        // Nexus is letting us know it can't finish the handshake until
        // the app is ready.
        var shared_seed_str = shared_seed.toString();
        this.waiting_for_app[shared_seed_str] = seller_nexus;
    }

    sellerNowReadyFromApp() {
        console.log("--- seller now ready");
        for (var shared_seed_str in this.waiting_for_app) {
            console.log("--- unwaiting for app");
            var seller_nexus = this.waiting_for_app[shared_seed_str];
            delete this.waiting_for_app[shared_seed_str];
            seller_nexus.sellerNowReady();
        }
    }

    getOpinionInvoice(seller_nexus, item_id, request_uuid) {
        return this.stack.getOpinionInvoiceCb(item_id, request_uuid);
    }

    getOpinionSellerInfo(seller_nexus) {
        return this.stack.getOpinionSellerInfoCb();
    }
}


exports.SellerLayer = SellerLayer;
