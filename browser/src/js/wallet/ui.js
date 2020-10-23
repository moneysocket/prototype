// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('../ui/domutl.js').DomUtl;
const UpstreamStatusUi = require('../ui/upstream_status.js').UpstreamStatusUi;
const DownstreamStatusUi = require(
    '../ui/downstream_status.js').DownstreamStatusUi;
const Wad = require("../moneysocket/wad/wad.js").Wad;

const MODES = new Set(["PROVIDER_DISCONNECTED",
                       "MAIN",
                       "SEND",
                       "RECEIVE",
                      ]);

class WalletUi {
    constructor(div, app) {
        this.parent_div = div;
        this.app = app;
        this.my_div = null;

        this.upstream_ui = null;
        this.downstream_ui = null;

        this.provide_wad = Wad.bitcoin(0);
        this.provider_wad = Wad.bitcoin(0);

        this.balance_div = null;
        this.slider_input = null;
        this.slider_val = 100;

        this.send_input_div = null;
        this.receive_div = null;
        this.bolt11 = "";
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.wallet_mode_div = DomUtl.emptyDiv(this.my_div);
        this.wallet_mode_div.setAttribute("class", "app-mode-output");

        DomUtl.drawBr(this.my_div);
        this.upstream_ui = new UpstreamStatusUi(this.my_div, "Upstream");
        this.upstream_ui.draw("upstream-status-left");
        this.downstream_ui = new DownstreamStatusUi(this.my_div, "Downstream");
        this.downstream_ui.draw("downstream-status-right");

        this.switchMode("PROVIDER_DISCONNECTED");

        this.parent_div.appendChild(this.my_div);
    }


    switchMode(new_mode) {
        console.assert(MODES.has(new_mode));
        this.mode = new_mode;
        DomUtl.deleteChildren(this.wallet_mode_div);

        if (new_mode == "PROVIDER_DISCONNECTED") {
            var t = DomUtl.drawText(this.wallet_mode_div,
                "Please connect to downstream Moneysocket wallet provider.");
            t.setAttribute("style", "padding:5px;");
        } else if (new_mode == "MAIN") {
            this.balance_div = DomUtl.emptyDiv(this.wallet_mode_div);
            DomUtl.drawBigWad(this.balance_div, this.provide_wad);
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Manual Send",
                (function() {
                    this.switchMode("SEND");
                }).bind(this));
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Manual Receive",
                (function() {
                    this.switchMode("RECEIVE");
                }).bind(this));
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawBr(this.wallet_mode_div);
            var t = DomUtl.drawText(this.wallet_mode_div,
                                    "Provide Upstream Balance:");
            t.setAttribute("style", "padding:5px;");
            var s = DomUtl.drawSlider(this.wallet_mode_div, this.slider_val);
            DomUtl.drawBr(this.wallet_mode_div);
            this.slider_input = s.firstChild;
            this.slider_input.oninput = (function () {
                this.updateProvideWad();
            }.bind(this));
        } else if (new_mode == "SEND") {
            this.balance_div = DomUtl.emptyDiv(this.wallet_mode_div);
            DomUtl.drawBigWad(this.balance_div, this.provide_wad);
            DomUtl.drawBr(this.wallet_mode_div);

            var t = DomUtl.drawText(this.wallet_mode_div, "Provide Bolt11");
            t.setAttribute("style", "padding:5px;");
            this.input_div = DomUtl.drawTextInput(this.wallet_mode_div, "");
            DomUtl.drawButton(this.wallet_mode_div, "Scan QR",
                (function() {
                    console.log("qr scan not implemented yet");
                }).bind(this));
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Pay Bolt11",
                (function() {
                    this.payBolt11();
                }).bind(this));
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Back",
                (function() {
                    this.switchMode("MAIN");
                }).bind(this));

        } else if (new_mode == "RECEIVE") {
            this.balance_div = DomUtl.emptyDiv(this.wallet_mode_div);
            DomUtl.drawBigWad(this.balance_div, this.provide_wad);
            DomUtl.drawBr(this.wallet_mode_div);

            this.receive_div = DomUtl.emptyDiv(this.wallet_mode_div);

            var t = DomUtl.drawText(this.receive_div, "Request sats:");
            t.setAttribute("style", "padding:5px;");
            this.input_div = DomUtl.drawTextInput(this.receive_div, "10");
            this.input_div.firstChild.setAttribute("size", "8");
            DomUtl.drawBr(this.receive_div);
            DomUtl.drawButton(this.receive_div, "Request Bolt11",
                (function() {
                    this.requestInvoice();
                }).bind(this));

            DomUtl.drawBr(this.wallet_mode_div);
            DomUtl.drawButton(this.wallet_mode_div, "Back",
                (function() {
                    this.switchMode("MAIN");
                }).bind(this));
        }
    }

    updateProvideWad() {
        this.slider_val = this.slider_input.value;

        var msats = this.provider_wad.msats;
        var asset_units = this.provider_wad.asset_units;
        this.provide_wad.msats = Math.round(msats * (this.slider_val / 100))
        this.provide_wad.asset_units = Math.round(
            asset_units * (this.slider_val / 100))
        DomUtl.deleteChildren(this.balance_div);
        DomUtl.drawBigWad(this.balance_div, this.provide_wad);
        this.app.setUpstreamProviderWad(this.provide_wad);
    }

    consumerOnline() {
        console.log("consumer is now online");
        this.downstream_ui.updateConnected();
        this.switchMode("MAIN");
    }

    consumerOffline() {
        console.log("consumer is now offline");
        this.downstream_ui.updateDisconnected();
        this.switchMode("PROVIDER_DISCONNECTED");
    }

    balanceUpdateFromDownstream(wad) {
        this.downstream_ui.updateProviderWad(wad);
        this.provider_wad = wad;
        this.updateProvideWad();
    }

    pingUpdate(msecs) {
        this.downstream_ui.updatePingTime(msecs);
    }

    providerOnline() {
        console.log("provider is now online");
        this.upstream_ui.updateConnected();
    }

    providerOffline() {
        console.log("provider is now offline");
        this.upstream_ui.updateDisconnected();
    }

    ///////////////////////////////////////////////////////////////////////////

    drawBolt11(bolt11){
        this.bolt11 = bolt11;
        DomUtl.deleteChildren(this.receive_div);
        DomUtl.qrCode(this.receive_div, bolt11);
        DomUtl.drawBr(this.receive_div);
        DomUtl.drawButton(this.receive_div, "Copy Bolt11",
            (function() {
                navigator.clipboard.writeText(this.bolt11);
                var t = DomUtl.drawText(this.receive_div, "Copied Bolt11")
                t.setAttribute("style", "padding:10px;");
            }).bind(this));
    }

    notifyInvoice(bolt11) {
        console.log("got bolt11: " + bolt11);
        this.drawBolt11(bolt11);
    }

    ///////////////////////////////////////////////////////////////////////////

    payBolt11() {
        console.log("pay bolt11 stub")
        var bolt11 = this.input_div.firstChild.value
        // TODO - validate bolt11 parses
        this.app.requestPay(bolt11);
    }

    requestInvoice(msats) {
        console.log("request bolt11 stub")
        var msats = parseInt(this.input_div.firstChild.value) * 1000;
        this.app.requestInvoice(msats);
    }
}

exports.WalletUi = WalletUi;
