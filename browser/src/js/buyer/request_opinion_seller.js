// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const MoneysocketRequest = require(
    '../moneysocket/message/request/request.js').MoneysocketRequest;
const Uuid = require('../moneysocket/utl/uuid.js').Uuid;
const BinUtl = require('../moneysocket/utl/bin.js').BinUtl;

let REQUEST_SUBCLASSES = require(
    '../moneysocket/message/request/request.js').REQUEST_SUBCLASSES;


class RequestOpinionSeller extends MoneysocketRequest {
    constructor() {
        super("REQUEST_OPINION_SELLER");
        this.extension_protocol = "OPINION_SELLER_DEMO_V0";
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new RequestOpinionSeller();
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if (typeof msg_dict['extension_protocol'] != 'string') {
            return "unknown extension_protocol type";
        }
        if (msg_dict['extension_protocol'] != "OPINION_SELLER_DEMO_V0") {
            return "protocol not understood";
        }
        return null;
    }
}

REQUEST_SUBCLASSES['REQUEST_OPINION_SELLER'] = RequestOpinionSeller;

exports.RequestOpinionSeller = RequestOpinionSeller;
