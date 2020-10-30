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
        this.provider_wad = null;

        this.for_sale_div = null;

        console.assert(typeof this.app.openStore == 'function');
        console.assert(typeof this.app.closeStore == 'function');

        this.hello_input = null;
        this.hello_price = 0.01;
        this.time_input = null;
        this.time_price = 0.02;
        this.opinion_input = null;
        this.opinion_price = 0.03;
    }

    draw(style) {
        this.my_div = document.createElement("div");
        this.my_div.setAttribute("class", style);

        this.opinion_div = DomUtl.emptyDiv(this.my_div);
        this.updateCurrentOpinion(this.opinion);


        DomUtl.drawButton(this.my_div, "Bullish",
            (function() {this.updateCurrentOpinion("Bullish")}
            ).bind(this));
        DomUtl.drawButton(this.my_div, "Bearish",
            (function() {this.updateCurrentOpinion("Bearish")}).bind(this));
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

    /*
    drawPriceInput(div, title, defaultText) {
        var t = DomUtl.drawText(this.for_sale_div, title + ":");
        //t.setAttribute("style", "padding:1px;");
        div.appendChild(t);
        var i = document.createElement("input");
        i.setAttribute("type", "text");
        i.setAttribute("size", "8");
        i.setAttribute("value", defaultText);
        div.appendChild(i);
        return i;
    }
    */

    drawPriceTable(div) {
        var x = document.createElement("table");
        x.setAttribute("id", "price-table");
        div.appendChild(x);

        var y = document.createElement("tr");
        y.setAttribute("id", "price-table-row");
        x.appendChild(y);

        var z = document.createElement("td");
        var t = document.createTextNode("Hello");
        z.appendChild(t);

        this.hello_input = document.createElement("input");
        this.hello_input.setAttribute("id", "hello-price");
        this.hello_input.setAttribute("type", "text");
        this.hello_input.setAttribute("size", "2");
        this.hello_input.setAttribute("value", this.hello_price);

        z.appendChild(this.hello_input);

        var a = document.createElement("td");
        var b = document.createTextNode("Time");
        a.appendChild(b);

        this.time_input = document.createElement("input");
        this.time_input.setAttribute("id", "time-price");
        this.time_input.setAttribute("type", "text");
        this.time_input.setAttribute("size", "2");
        this.time_input.setAttribute("value", this.time_price);
        a.appendChild(this.time_input);

        var c = document.createElement("td");
        var d = document.createTextNode("Opinion");
        c.appendChild(d);

        this.opinion_input = document.createElement("input");
        this.opinion_input.setAttribute("type", "text");
        this.opinion_input.setAttribute("size", "2");
        this.opinion_input.setAttribute("value", this.opinion_price);
        c.appendChild(this.opinion_input);

        y.appendChild(z);
        y.appendChild(a);
        y.appendChild(c);
    }

    getPriceSettings() {
        var h = this.hello_input.value;
        var t = this.time_input.value;
        var o = this.opinion_input.value;
        return [parseFloat(h), parseFloat(t), parseFloat(o)];
    }


    updateCurrentOpinion(opinion) {
        this.opinion = opinion;
        DomUtl.deleteChildren(this.opinion_div);
        DomUtl.drawText(this.opinion_div, "Current Opinion: ");
        DomUtl.drawBigText(this.opinion_div, opinion);
    }

    openStore() {
        var [h, t, o] = this.getPriceSettings();
        this.hello_price = h;
        this.time_price = t;
        this.opinion_price = o;
        DomUtl.deleteChildren(this.for_sale_div);
        DomUtl.drawButton(this.for_sale_div, "Close Store",
            (function() {this.closeStore()}).bind(this));
        this.app.openStore();
        console.log("getPriceSettings: " + this.getPriceSettings());
    }

    closeStore() {
        DomUtl.deleteChildren(this.for_sale_div);


        //var t = DomUtl.drawText(this.for_sale_div, "Hello:");
        //t.setAttribute("style", "padding:1px;");
        //this.drawPriceInput(this.for_sale_div, "Hello", "0.1");

        this.drawPriceTable(this.for_sale_div);

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

    balanceUpdateFromDownstream(wad) {
        this.provider_wad = wad;
        this.downstream_ui.updateProviderWad(wad);
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
