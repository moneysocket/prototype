// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const BinUtl = require('../moneysocket/utl/bin.js').BinUtl;
const MoneysocketNotification = require(
    '../moneysocket/message/notification/notification.js'
    ).MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    '../moneysocket/message/notification/notification.js'
    ).NOTIFICATION_SUBCLASSES;

class NotifyOpinionInvoice extends MoneysocketNotification {
    constructor(request_reference_uuid, bolt11) {
        super("NOTIFY_OPINION_INVOICE", request_reference_uuid);
        this.bolt11 = bolt11;
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyOpinionInvoice(msg_dict['request_reference_id'],
                                         msg_dict['bolt11']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if ( !('bolt11' in msg_dict)) {
            return "no bolt11 included";
        }
        if (typeof msg_dict['bolt11'] != 'string') {
            return "unknown bolt11 type";
        }
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_OPINION_INVOICE'] = NotifyOpinionInvoice;

exports.NotifyOpinionInvoice = NotifyOpinionInvoice;
