// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php



const ProtocolLayer = require(
    "../moneysocket/protocol/layer.js").ProtocolLayer;
const BuyerNexus = require("./nexus.js").BuyerNexus;


class BuyerLayer extends ProtocolLayer {
    constructor() {
        super();

        this.onsellerinfo = null;
        this.onopinioninvoice = null;
        this.onopinion = null;
    }

    setupBuyerNexus(below_nexus) {
        var n = new BuyerNexus(below_nexus, this);
        n.onsellerinfo = (function(nexus, seller_info) {
            this.onSellerInfo(nexus, seller_info);
        }).bind(this);
        n.onopinion = (function(nexus, item_id, opinion) {
            this.onOpinion(nexus, item_id, opinion);
        }).bind(this);
        n.onopinioninvoice = (function(nexus, bolt11, request_reference_uuid) {
            this.onOpinionInvoice(nexus, bolt11, request_reference_uuid);
        }).bind(this);
        return n;
    }

    announceNexus(below_nexus) {
        console.log("buyer layer got nexus, starting handshake");
        var buyer_nexus = this.setupBuyerNexus(below_nexus);
        this._trackNexus(buyer_nexus, below_nexus);

        buyer_nexus.startHandshake(this.buyerFinishedCb.bind(this));
    }

    revokeNexus(below_nexus) {
        var buyer_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexus(below_nexus);
    }

    buyerFinishedCb(buyer_nexus) {
        this._trackNexusAnnounced(buyer_nexus);
        this.sendLayerEvent(buyer_nexus, "NEXUS_ANNOUNCED");
        console.log("announcing from buyer layer");
        if (this.onnexusonline != null) {
            console.log("actually announcing from buyer layer");
            this.onnexusonline(buyer_nexus);
        }
    }

    onOpinionInvoice(buyer_nexus, bolt11, request_reference_uuid) {
        if (this.onopinioninvoice != null) {
            this.onopinioninvoice(buyer_nexus, bolt11, request_reference_uuid);
        }
    }

    onOpinion(buyer_nexus, item_id, opinion) {
        if (this.onopinion != null) {
            this.onopinion(buyer_nexus, item_id, opinion);
        }
    }

    onSellerInfo(buyer_nexus, seller_info) {
        console.log("got seller info: " + seller_info);
        if (this.onsellerinfo != null) {
            this.onsellerinfo(buyer_nexus, seller_info);
        }
    }

}


exports.BuyerLayer = BuyerLayer;
