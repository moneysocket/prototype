// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketRequest = require(
    '../moneysocket/message/request/request.js').MoneysocketRequest;
const Uuid = require('../moneysocket/utl/uuid.js').Uuid;
const BinUtl = require('../moneysocket/utl/bin.js').BinUtl;

let REQUEST_SUBCLASSES = require(
    '../moneysocket/message/request/request.js').REQUEST_SUBCLASSES;


class RequestOpinionInvoice extends MoneysocketRequest {
    constructor(item_id) {
        super("REQUEST_OPINION_INVOICE");
        this.item_id = item_id;
        this.extension_protocol = "OPINION_SELLER_DEMO_V0";
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new RequestOpinionInvoice(msg_dict['item_id']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if (! ('item_id' in msg_dict)) {
            return "no item_id included";
        }
        if (typeof msg_dict['item_id'] != 'string') {
            return "unknown item_id type";
        }
        if (! ('extension_protocol' in msg_dict)) {
            return "no extension_protocol included";
        }
        if (typeof msg_dict['extension_protocol'] != 'string') {
            return "unknown extension_protocol type";
        }
        if (msg_dict['extension_protocol'] != "OPINION_SELLER_DEMO_V0") {
            return "protocol not understood";
        }
        return null;
    }

}

REQUEST_SUBCLASSES['REQUEST_OPINION_INVOICE'] = RequestOpinionInvoice;

exports.RequestOpinionInvoice = RequestOpinionInvoice;
