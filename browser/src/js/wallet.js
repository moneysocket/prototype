// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const DomUtl = require('./ui/domutl.js').DomUtl;
const Uuid = require('./moneysocket/utl/uuid.js').Uuid;
const ConnectUi = require('./ui/connect.js').ConnectUi;
const WalletUi = require("./wallet/ui.js").WalletUi;
const ProviderStack = require("./moneysocket/stack/provider.js").ProviderStack;
const ConsumerStack = require("./moneysocket/stack/consumer.js").ConsumerStack;
const Wad = require("./moneysocket/wad/wad.js").Wad;

///////////////////////////////////////////////////////////////////////////////

class WalletApp {
    constructor() {
        this.parent_div = document.getElementById("ui");
        this.my_div = DomUtl.emptyDiv(this.parent_div);

        this.wallet_ui = new WalletUi(this.my_div, this);

        this.provider_stack = this.setupProviderStack();
        this.consumer_stack = this.setupConsumerStack();

        this.provider_ui = new ConnectUi(this.my_div, "Moneysocket Provider",
                                         this.provider_stack);
        this.consumer_ui = new ConnectUi(this.my_div, "Moneysocket Consumer",
                                         this.consumer_stack);

        this.downstream_info = {'ready': false};
        this.upstream_info = {'ready': false};
        this.account_uuid = Uuid.uuidv4();
        this.requests_from_provider = new Set();
    }

    setupProviderStack() {
        var s = new ProviderStack();
        s.onnexusonline = (function(nexus) {
            this.providerOnNexusOnline(nexus);
        }).bind(this);
        s.onnexusoffline = (function(nexus) {
            this.providerOnNexusOffline(nexus);
        }).bind(this);
        s.onstackevent = (function(layer_name, nexus, status) {
            this.providerOnStackEvent(layer_name, nexus, status);
        }).bind(this);
        s.handleinvoicerequest = (function(msats, request_uuid) {
            this.providerHandleInvoiceRequest(msats, request_uuid);
        }).bind(this);
        s.handlepayrequest = (function(bolt11, request_uuid) {
            this.providerHandlePayRequest(bolt11, request_uuid);
        }).bind(this);
        s.handleproviderinforequest = (function() {
            return this.handleProviderInfoRequest();
        }).bind(this);
        return s;
    }

    setupConsumerStack() {
        var s = new ConsumerStack();
        s.onnexusonline = (function(nexus) {
            this.consumerOnNexusOnline(nexus);
        }).bind(this);
        s.onnexusoffline = (function(nexus) {
            this.consumerOnNexusOffline(nexus);
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

    drawWalletAppUi() {
        this.my_div.setAttribute("class", "bordered");
        DomUtl.drawTitle(this.my_div, "Moneysocket Web Wallet", "h2");
        this.wallet_ui.draw("center");
        DomUtl.drawBr(this.my_div);
        this.provider_ui.draw("left");
        this.consumer_ui.draw("right");
        DomUtl.drawBr(this.my_div);
        DomUtl.drawBr(this.my_div);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Consumer Stack Callbacks
    ///////////////////////////////////////////////////////////////////////////

    consumerOnNexusOnline(nexus) {
        this.wallet_ui.consumerOnline();
    }

    consumerOnNexusOffline(nexus) {
        this.upstream_info = {'ready': false};
        this.wallet_ui.consumerOffline();
    }

    consumerOnStackEvent(layer_name, nexus, status) {
        this.consumer_ui.postStackEvent(layer_name, status);
    }

    consumerOnProviderInfo(provider_info) {
        var was_ready = this.downstream_info['ready'];
        this.downstream_info = provider_info;
        this.downstream_info['ready'] = true;
        this.wallet_ui.balanceUpdateFromDownstream(
            this.downstream_info['wad']);
        if (! was_ready) {
            this.provider_stack.providerNowReadyFromApp();
        }
    }

    consumerOnPing(msecs) {
        this.wallet_ui.pingUpdate(msecs);
    }

    consumerOnInvoice(bolt11, request_reference_uuid) {
        console.log("got invoice from consumer: " + request_reference_uuid);
        if (! this.requests_from_provider.has(request_reference_uuid)) {
            this.wallet_ui.notifyInvoice(bolt11);
        } else {
            this.provider_stack.fulfilRequestInvoice(bolt11,
                                                     request_reference_uuid);
            this.requests_from_provider.delete(request_reference_uuid);
        }
    }

    consumerOnPreimage(preimage, request_reference_uuid) {
        if (! this.requests_from_provider.has(request_reference_uuid)) {
            console.log("got preimage from consumer: " + preimage);
        } else {
            this.provider_stack.fulfilRequestPay(preimage,
                                                 request_reference_uuid);
            this.requests_from_provider.delete(request_reference_uuid);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Provider Stack Callbacks
    ///////////////////////////////////////////////////////////////////////////

    providerOnNexusOnline(nexus) {
        this.wallet_ui.providerOnline();
    }

    providerOnNexusOffline() {
        this.wallet_ui.providerOffline();
    }

    providerOnStackEvent(layer_name, nexus, status) {
        this.provider_ui.postStackEvent(layer_name, status);
    }

    providerHandleInvoiceRequest(msats, request_uuid) {
        // TODO - send error back if no consumer online
        this.consumer_stack.requestInvoice(msats, request_uuid);
        console.log("got invoice request from provider: " + request_uuid);
        this.requests_from_provider.add(request_uuid);
    }

    providerHandlePayRequest(bolt11, request_uuid) {
        // TODO - send error back if no consumer online
        this.consumer_stack.requestPay(bolt11, request_uuid);
        console.log("got pay request from provider: " + request_uuid);
        this.requests_from_provider.add(request_uuid);
    }

    handleProviderInfoRequest(shared_seed) {
        return this.upstream_info;
    }

    ///////////////////////////////////////////////////////////////////////////
    // UI calls these
    ///////////////////////////////////////////////////////////////////////////

    setUpstreamProviderWad(wad) {
        this.upstream_info = {'ready':         true,
                              'payer':         this.downstream_info['payer'],
                              'payee':         this.downstream_info['payee'],
                              'wad':           wad,
                              'account_uuid':  this.account_uuid};
        this.provider_stack.sendProviderInfoUpdate();
    }


    requestInvoice(msats) {
        this.consumer_stack.requestInvoice(msats, null);
    }

    requestPay(bolt11) {
        this.consumer_stack.requestPay(bolt11, null);
    }
}

window.app = new WalletApp();


function drawFirstUi() {
    window.app.drawWalletAppUi()

}

window.addEventListener("load", drawFirstUi());
