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

class NotifyOpinion extends MoneysocketNotification {
    constructor(request_reference_uuid, item_id, opinion) {
        super("NOTIFY_OPINION", request_reference_uuid);
        this.opinion = opinion;
        this.item_id = item_id;
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyOpinion(msg_dict['request_reference_id'],
                                  msg_dict['item_id'], msg_dict['opinion']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if ( !('opinion' in msg_dict)) {
            return "no opinion included";
        }
        if (typeof msg_dict['opinion'] != 'string') {
            return "unknown opinion type";
        }
        if ( !('item_id' in msg_dict)) {
            return "no item_id included";
        }
        if (typeof msg_dict['item_id'] != 'string') {
            return "unknown item_id type";
        }
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_OPINION'] = NotifyOpinion;

exports.NotifyOpinion = NotifyOpinion;
