// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('../ui/domutl.js').DomUtl;
const DownstreamStatusUi = require(
    '../ui/downstream_status.js').DownstreamStatusUi;
const Wad = require('../moneysocket/wad/wad.js').Wad;

const MODES = new Set(["BOTH_DISCONNECTED",
                       "MY_WALLET_DISCONNECTED",
                       "SELLER_DISCONNECTED",
                       "OPERATE",
                      ]);


class BuyerUi {
    constructor(div, app) {
        this.parent_div = div;
        this.app = app;
        this.my_div = DomUtl.emptyDiv(this.parent_div);

        this.mode = null;

        this.seller_ui = null;
        this.downstream_ui = null;

        this.log = null;

        this.available_wad = Wad.bitcoin(0);
        this.seller_consumer_connected = false;
        this.my_seller_connected = false;
        this.buying_running = false;
    }

    draw(style) {
        this.buyer_mode_div = DomUtl.emptyDiv(this.my_div);
        this.buyer_mode_div.setAttribute("class", "app-mode-output");

        DomUtl.drawBr(this.my_div);
        this.seller_ui = new DownstreamStatusUi(this.my_div, "Seller");
        this.seller_ui.draw("downstream-status-left");
        this.downstream_ui = new DownstreamStatusUi(this.my_div, "Downstream");
        this.downstream_ui.draw("downstream-status-right");

        this.switchMode("BOTH_DISCONNECTED");

        this.parent_div.appendChild(this.my_div);
    }

    switchMode(new_mode) {
        console.assert(MODES.has(new_mode));
        if (this.mode == new_mode) {
            return;
        }
        this.mode = new_mode;
        DomUtl.deleteChildren(this.buyer_mode_div);
        console.log("new mode");
        if (new_mode == "BOTH_DISCONNECTED") {
            var t = DomUtl.drawText(this.buyer_mode_div,
                "Please connect to downstream Moneysocket wallet provider.");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "SELLER_DISCONNECTED") {
            this.balance_div = DomUtl.emptyDiv(this.buyer_mode_div);
            DomUtl.drawBigWad(this.balance_div, this.available_wad);
            DomUtl.drawBr(this.buyer_mode_div);
            DomUtl.drawBr(this.buyer_mode_div);
            var t = DomUtl.drawText(this.buyer_mode_div,
                "Connect to upstream seller app provider");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "MY_WALLET_DISCONNECTED") {
            var t = DomUtl.drawText(this.buyer_mode_div,
                "Connect to downstream provider");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "OPERATE") {
            this.balance_div = DomUtl.emptyDiv(this.buyer_mode_div);
            DomUtl.drawBigWad(this.balance_div, this.available_wad);
            this.buttons_div = DomUtl.emptyDiv(this.buyer_mode_div);
            this.log = DomUtl.drawLog(this.buyer_mode_div);
        } else {
            console.error("unhandled mode");
        }
    }


    displayItemsForSale(items) {
        for (var i = 0; i < items.length; i++) {
            var wad = Wad.clone_msats(this.available_wad, items[i]['msats']);
            var label = items[i]['name'] + ": " + wad.toString();
            let item_id = items[i]['item_id'];
            DomUtl.drawButton(this.buttons_div, label,
                (function() {
                    this.app.buyItem(item_id);
                }).bind(this));
        }
    }

    logPrint(text) {
        var d = new Date();
        var line = d.toLocaleString() + "> " + text;
        this.log.innerHTML += line + '\n';
        this.log.scrollTop = this.log.scrollHeight;
    }

    postOpinion(opinion) {
        this.logPrint("got opinion: " + opinion);
    }

    consumerOnline() {
        console.log("consumer is now online");
        this.downstream_ui.updateConnected();
        if (this.mode == "MY_WALLET_DISCONNECTED") {
            this.switchMode("OPERATE");
        } else {
            this.switchMode("SELLER_DISCONNECTED");
        }
    }

    consumerOffline() {
        console.log("consumer is now offline");
        this.downstream_ui.updateDisconnected();
        if (this.mode == "OPERATE") {
            this.switchMode("MY_WALLET_DISCONNECTED");
        } else {
            this.switchMode("BOTH_DISCONNECTED");
        }
    }

    pingUpdate(msecs) {
        this.downstream_ui.updatePingTime(msecs);
    }

    sellerPingUpdate(msecs) {
        this.seller_ui.updatePingTime(msecs);
    }

    balanceUpdate(provider_info) {
        this.available_wad = provider_info['wad'];
        this.downstream_ui.updateProviderWad(this.available_wad);
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawBigWad(this.balance_div, this.available_wad);
    }

    sellerOnline() {
        console.log("seller is now online");
        this.seller_ui.updateConnected();
        if (this.mode == "SELLER_DISCONNECTED") {
            this.switchMode("OPERATE");
        } else {
            this.switchMode("MY_WALLET_DISCONNECTED");
        }
    }

    sellerOffline() {
        console.log("seller is now offline");
        this.seller_ui.updateDisconnected();
        if (this.mode == "OPERATE") {
            this.switchMode("SELLER_DISCONNECTED");
        } else {
            this.switchMode("BOTH_DISCONNECTED");
        }
    }

    ///////////////////////////////////////////////////////////////////////////

}

exports.BuyerUi = BuyerUi;
