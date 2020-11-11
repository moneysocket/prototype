// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php



const Layer = require(
    "../moneysocket/protocol/layer.js").Layer;
const SellerNexus = require("./nexus.js").SellerNexus;


class SellerLayer extends Layer {
    constructor() {
        super();
        this.waiting_for_app = {};
        this.nexus_by_shared_seed = {};

        this.handleopinioninvoicerequest = null;
        this.handlesellerinforequest = null;
    }

    setupSellerNexus(below_nexus) {
        var n = new SellerNexus(below_nexus, this);
        n.handleopinioninvoicerequest = (
            function(nexus, item_id, request_uuid) {
                this.handleOpinionInvoiceRequest(nexus, item_id, request_uuid);
            }).bind(this);
        n.handlesellerinforequest = (
            function() {
                return this.handleSellerInfoRequest();
            }).bind(this);
        return n;
    }

    announceNexus(below_nexus) {
        console.log("buyer layer got nexus, starting handshake");
        var seller_nexus = this.setupSellerNexus(below_nexus)
        this._trackNexus(seller_nexus, below_nexus);

        this.sendLayerEvent(seller_nexus, "NEXUS_WAITING");
        seller_nexus.waitForBuyer(this.sellerFinishedCb.bind(this));
    }


    sellerFinishedCb(seller_nexus) {
        this._trackNexusAnnounced(seller_nexus);
        this.sendLayerEvent(seller_nexus, "NEXUS_ANNOUNCED");
        if (this.onannounce != null) {
            this.onannounce(seller_nexus);
        }
    }

    revokeNexus(below_nexus) {
        var seller_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexus(below_nexus);

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

    handleOpinionInvoiceRequest(seller_nexus, item_id, request_uuid) {
        console.assert(this.handleopinioninvoicerequest != null);
        return this.handleopinioninvoicerequest(seller_nexus, item_id,
                                                request_uuid);
    }

    handleSellerInfoRequest(seller_nexus) {
        console.assert(this.handlesellerinforequest != null);
        return this.handlesellerinforequest(seller_nexus);
    }
}


exports.SellerLayer = SellerLayer;
