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

        this.buyer_stack = new BuyerStack(this);
        this.buyer_ui = new BuyerConnectUi(this.my_div, "Buyer Consumer",
                                           this.buyer_stack);
        this.wallet_stack = new ConsumerStack(this);
        this.wallet_ui = new ConnectUi(this.my_div, "My Wallet Consumer",
                                       this.wallet_stack);
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

    consumerOnlineCb() {
        this.buyer_app_ui.consumerOnline();
    }

    consumerOfflineCb() {
        this.buyer_app_ui.consumerOffline();
        this.buyer_stack.doDisconnect();
    }

    consumerReportProviderInfoCb(provider_info) {
        this.buyer_app_ui.balanceUpdate(provider_info);
    }

    consumerReportPingCb(msecs) {
        this.buyer_app_ui.pingUpdate(msecs);
    }

    consumerPostStackEventCb(layer_name, status) {
        this.wallet_ui.postStackEvent(layer_name, status);
    }

    consumerReportBolt11Cb(bolt11, request_reference_uuid) {
        // should not happen
    }

    consumerReportPreimageCb(preimage, request_reference_uuid) {
        // should not happen
    }

    ///////////////////////////////////////////////////////////////////////////
    // Buyer Stack Callbacks
    ///////////////////////////////////////////////////////////////////////////


    buyerOnlineCb() {
        this.buyer_app_ui.sellerOnline();
        this.buyer_app_ui.logPrint("connect to seller!");
    }

    buyerOfflineCb() {
        this.buyer_app_ui.sellerOffline();
    }

    buyerReportProviderInfoCb(provider_info) {
    }

    buyerReportPingCb(msecs) {
        this.buyer_app_ui.sellerPingUpdate(msecs);
    }

    buyerPostStackEventCb(layer_name, status) {
        this.buyer_ui.postStackEvent(layer_name, status);
    }

    buyerReportBolt11Cb(bolt11, request_reference_uuid) {
        console.log("got invoice from seller: " + request_reference_uuid);
    }

    buyerReportPreimageCb(preimage, request_reference_uuid) {
        console.log("got preimage from seller: " + request_reference_uuid);
    }

    buyerReportSellerInfoCb(seller_info) {
        console.log("got seller info: " + JSON.stringify(seller_info));
        this.buyer_app_ui.displayItemsForSale(seller_info['items']);
    }

    buyerReportOpinionInvoiceCb(bolt11, request_reference_uuid) {
        // forward along to wallet
        this.wallet_stack.requestPay(bolt11, request_reference_uuid);
    }

    buyerReportOpinionCb(item_id, opinion) {
        this.buyer_app_ui.logPrint("got: " + item_id + ": " + opinion);
    }

}


window.app = new BuyerApp();

function drawFirstUi() {
    window.app.drawBuyerUi()
}

window.addEventListener("load", drawFirstUi());
