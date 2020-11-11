// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./ui/domutl.js').DomUtl;

const Uuid = require('./moneysocket/utl/uuid.js').Uuid;
const Timestamp = require('./moneysocket/utl/timestamp.js').Timestamp;
const WebsocketLocation = require(
    './moneysocket/beacon/location/websocket.js').WebsocketLocation;

const BuyerUi = require('./buyer/ui.js').BuyerUi;

const BuyerConnectUi = require('./buyer/connect_ui.js').BuyerConnectUi;
const ConnectUi = require('./ui/connect.js').ConnectUi;

const ConsumerStack = require("./moneysocket/stack/consumer.js").ConsumerStack;
const BuyerStack = require("./buyer/stack.js").BuyerStack;


const GOOD_OPINIONS = new Set(["Bullish",
                               "Bearish",
                              ]);


class BuyerApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = DomUtl.emptyDiv(this.parent_div);
        this.my_div.setAttribute("class", "bordered");

        this.buyer_app_ui = new BuyerUi(this.my_div, this);

        this.buyer_stack = this.setupBuyerStack();
        this.wallet_stack = this.setupConsumerStack();

        this.wallet_ui = new ConnectUi(this.my_div, "My Wallet Consumer",
                                       this.wallet_stack);
        this.buyer_ui = new BuyerConnectUi(this.my_div, "Buyer Consumer",
                                           this.buyer_stack);
    }

    setupBuyerStack() {
        var s = new BuyerStack();
        s.onannounce = (function(nexus) {
            this.buyerOnAnnounce(nexus);
        }).bind(this);
        s.onrevoke = (function(nexus) {
            this.buyerOnRevoke(nexus);
        }).bind(this);
        s.onproviderinfo = (function(provider_info) {
            this.buyerOnProviderInfo(provider_info);
        }).bind(this);
        s.onstackevent = (function(layer_name, nexus, status) {
            this.buyerOnStackEvent(layer_name, nexus, status);
        }).bind(this);
        s.onping = (function(msecs) {
            this.buyerOnPing(msecs);
        }).bind(this);
        s.oninvoice = (function(bolt11, request_reference_uuid) {
            this.buyerOnInvoice(bolt11, request_reference_uuid);
        }).bind(this);
        s.onpreimage = (function(preimage, request_reference_uuid) {
            this.buyerOnPreimage(preimage, request_reference_uuid);
        }).bind(this);
        s.onopinion = (function(nexus, item_id, opinion) {
            this.buyerOnOpinion(nexus, item_id, opinion);
        }).bind(this);
        s.onopinioninvoice = (function(nexus, bolt11, request_reference_uuid) {
            this.buyerOnOpinionInvoice(nexus, bolt11, request_reference_uuid);
        }).bind(this);
        s.onsellerinfo = (function(nexus, seller_info) {
            this.buyerOnSellerInfo(nexus, seller_info);
        }).bind(this);
        return s;
    }

    setupConsumerStack() {
        var s = new ConsumerStack();
        s.onannounce = (function(nexus) {
            this.consumerOnAnnounce(nexus);
        }).bind(this);
        s.onrevoke = (function(nexus) {
            this.consumerOnRevoke(nexus);
        }).bind(this);
        s.onproviderinfo = (function(provider_info) {
            this.consumerOnProviderInfo(provider_info);
        }).bind(this);
        s.onstackevent = (function(layer_name, nexus, status) {
            this.consumerOnStackEvent(layer_name, nexus, status);
        }).bind(this);
        s.onping = (function(msecs) {
            this.consumerOnPing(msecs);
        }).bind(this);
        s.oninvoice = (function(bolt11, request_reference_uuid) {
            this.consumerOnInvoice(bolt11, request_reference_uuid);
        }).bind(this);
        s.onpreimage = (function(preimage, request_reference_uuid) {
            this.consumerOnPreimage(preimage, request_reference_uuid);
        }).bind(this);
        return s;
    }

    drawBuyerUi() {
        DomUtl.drawTitle(this.my_div, "Opinion Buyer App", "h2");

        this.buyer_app_ui.draw("center");
        DomUtl.drawBr(this.my_div);
        this.buyer_ui.draw("left");
        this.wallet_ui.draw("right");

        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);
        this.parent_div.appendChild(this.my_div);
    }


    ///////////////////////////////////////////////////////////////////////////
    // UI calls
    ///////////////////////////////////////////////////////////////////////////

    buyItem(item_id) {
        this.buyer_app_ui.logPrint("buying: " + item_id);
        this.buyer_stack.buyItem(item_id);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Consumer Stack Callbacks
    ///////////////////////////////////////////////////////////////////////////

    consumerOnAnnounce(nexus) {
        this.buyer_app_ui.consumerOnline();
    }

    consumerOnRevoke(nexus) {
        this.buyer_app_ui.consumerOffline();
        this.buyer_stack.doDisconnect();
    }

    consumerOnProviderInfo(provider_info) {
        this.buyer_app_ui.balanceUpdate(provider_info);
    }

    consumerOnPing(msecs) {
        this.buyer_app_ui.pingUpdate(msecs);
    }

    consumerOnStackEvent(layer_name, nexus, status) {
        this.wallet_ui.postStackEvent(layer_name, status);
    }

    consumerOnInvoice(bolt11, request_reference_uuid) {
        // should not happen
    }

    consumerOnPreimage(preimage, request_reference_uuid) {
        // should not happen
    }

    ///////////////////////////////////////////////////////////////////////////
    // Buyer Stack Callbacks
    ///////////////////////////////////////////////////////////////////////////


    buyerOnAnnounce(nexus) {
        this.buyer_app_ui.sellerOnline();
        this.buyer_app_ui.logPrint("connect to seller!");
    }

    buyerOnRevoke(nexus) {
        this.buyer_app_ui.sellerOffline();
    }

    buyerOnProviderInfo(provider_info) {
    }

    buyerOnPing(msecs) {
        this.buyer_app_ui.sellerPingUpdate(msecs);
    }

    buyerOnStackEvent(layer_name, nexus, status) {
        this.buyer_ui.postStackEvent(layer_name, status);
    }

    buyerOnInvoice(bolt11, request_reference_uuid) {
        console.log("got invoice from seller: " + request_reference_uuid);
    }

    buyerOnPreimage(preimage, request_reference_uuid) {
        console.log("got preimage from seller: " + request_reference_uuid);
    }

    buyerOnSellerInfo(seller_info) {
        console.log("got seller info: " + JSON.stringify(seller_info));
        this.buyer_app_ui.displayItemsForSale(seller_info['items']);
    }

    buyerOnOpinionInvoice(bolt11, request_reference_uuid) {
        // forward along to wallet
        this.wallet_stack.requestPay(bolt11, request_reference_uuid);
    }

    buyerOnOpinion(item_id, opinion) {
        this.buyer_app_ui.logPrint("got: " + item_id + ": " + opinion);
    }

}


window.app = new BuyerApp();

function drawFirstUi() {
    window.app.drawBuyerUi()
}

window.addEventListener("load", drawFirstUi());
