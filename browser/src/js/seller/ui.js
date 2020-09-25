// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const DomUtl = require('../ui/domutl.js').DomUtl;
const UpstreamStatusUi = require('../ui/upstream_status.js').UpstreamStatusUi;
const DownstreamStatusUi = require(
    '../ui/downstream_status.js').DownstreamStatusUi;


class SellerUi {
    constructor(div, app) {
        this.app = app;
        this.parent_div = div;
        this.my_div = null;
        this.opinion = "Bullish"
        this.provider_msats = 0;

        this.for_sale_div = null;

        console.assert(typeof this.app.openStore == 'function');
        console.assert(typeof this.app.closeStore == 'function');
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.opinion_div = DomUtl.emptyDiv(this.my_div);
        this.updateCurrentOpinion(this.opinion);


        DomUtl.drawButton(this.my_div, "Bullish",
            (function() {this.updateCurrentOpinion("Bullish")}
            ).bind(this));
        DomUtl.drawBr(this.my_div);
        DomUtl.drawButton(this.my_div, "Bearish",
            (function() {this.updateCurrentOpinion("Bearish")}).bind(this));
        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);
        this.for_sale_div = DomUtl.emptyDiv(this.my_div);

        this.closeStore();

        DomUtl.drawBr(this.my_div);

        this.downstream_ui = new DownstreamStatusUi(this.my_div, "Downstream");
        this.downstream_ui.draw("downstream-status-left");

        this.upstream_ui = new UpstreamStatusUi(this.my_div, "Buyer");
        this.upstream_ui.draw("upstream-status-right");

        DomUtl.drawBr(this.my_div);

        this.parent_div.appendChild(this.my_div);
    }

    updateCurrentOpinion(opinion) {
        this.opinion = opinion;
        DomUtl.deleteChildren(this.opinion_div);
        DomUtl.drawText(this.opinion_div, "Current Opinion: ");
        DomUtl.drawBigText(this.opinion_div, opinion);
    }

    openStore() {
        DomUtl.deleteChildren(this.for_sale_div);
        DomUtl.drawButton(this.for_sale_div, "Close Store",
            (function() {this.closeStore()}).bind(this));
        this.app.openStore();
    }

    closeStore() {
        DomUtl.deleteChildren(this.for_sale_div);
        DomUtl.drawButton(this.for_sale_div, "Open Store",
            (function() {this.openStore()}).bind(this));
        this.app.closeStore();
    }

    getCurrentOpinion() {
        return this.opinion;
    }

    pingUpdate(msecs) {
        this.downstream_ui.updatePingTime(msecs);
    }

    balanceUpdateFromDownstream(msats) {
        this.provider_msats = msats;
        this.downstream_ui.updateProviderMsats(msats);
    }

    providerOnline() {
        this.upstream_ui.updateConnected();
    }
    providerOffline() {
        this.upstream_ui.updateDisconnected();
    }

    consumerOnline() {
        this.downstream_ui.updateConnected();
    }
    consumerOffline() {
        this.downstream_ui.updateDisconnected();
    }
}


exports.SellerUi = SellerUi;
