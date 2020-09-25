// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php



const ProtocolLayer = require(
    "../moneysocket/protocol/layer.js").ProtocolLayer;
const BuyerNexus = require("./nexus.js").BuyerNexus;


class BuyerLayer extends ProtocolLayer {
    constructor(stack, above_layer) {
        super(stack, above_layer, "BUYER");

        console.assert(typeof stack.gotOpinionInvoiceCb == 'function');
        console.assert(typeof stack.gotOpinionCb == 'function');
        console.assert(typeof stack.gotSellerCb == 'function');
    }

    announceNexusFromBelowCb(below_nexus) {
        console.log("buyer layer got nexus, starting handshake");
        var buyer_nexus = new BuyerNexus(below_nexus, this);
        this._trackNexus(buyer_nexus, below_nexus);

        buyer_nexus.startHandshake(this.buyerFinishedCb.bind(this));
    }

    revokeNexusFromBelowCb(below_nexus) {
        var buyer_nexus = this.nexuses[
            this.nexus_by_below[below_nexus.uuid]];
        super.revokeNexusFromBelowCb(below_nexus);
    }

    buyerFinishedCb(buyer_nexus) {
        this._trackNexusAnnounced(buyer_nexus);
        this.notifyAppOfStatus(buyer_nexus, "NEXUS_ANNOUNCED");
        this.announceNexusAboveCb(buyer_nexus);
    }


    gotOpinionInvoiceCb(buyer_nexus, bolt11, request_reference_uuid) {
        this.stack.gotOpinionInvoiceCb(buyer_nexus, bolt11,
                                       request_reference_uuid);
    }

    gotOpinionCb(buyer_nexus, item_id, opinion) {
        this.stack.gotOpinionCb(buyer_nexus, item_id, opinion);
    }

    gotSellerCb(buyer_nexus, seller_info) {
        this.stack.gotSellerCb(buyer_nexus, seller_info);
    }

}


exports.BuyerLayer = BuyerLayer;
