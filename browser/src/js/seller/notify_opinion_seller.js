// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../moneysocket/utl/bin.js').BinUtl;
const Uuid = require('../moneysocket/utl/uuid.js').Uuid;
const MoneysocketNotification = require(
    '../moneysocket/message/notification/notification.js'
    ).MoneysocketNotification;
let NOTIFICATION_SUBCLASSES = require(
    '../moneysocket/message/notification/notification.js'
    ).NOTIFICATION_SUBCLASSES;

class NotifyOpinionSeller extends MoneysocketNotification {

    constructor(seller_uuid, items, request_reference_uuid) {
        super("NOTIFY_OPINION_SELLER", request_reference_uuid);
        this.items = items;
        this.seller_uuid = seller_uuid;
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var c = new NotifyOpinionSeller(msg_dict['seller_uuid'],
                                        msg_dict['items'],
                                        msg_dict['request_reference_id']);
        Object.keys(msg_dict).forEach(key => {
            c[key] = msg_dict[key];
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        var item_id_set = new Set();
        if ( !('seller_uuid' in msg_dict)) {
            return "no seller_uuid included";
        }
        if (typeof msg_dict['seller_uuid'] != 'string') {
            return "unknown seller_uuid type";
        }
        if (! Uuid.isUuid(msg_dict['seller_uuid'])) {
            return "invalid seller_uuid";
        }

        if (! Array.isArray(msg_dict['items'])) {
            return "items not an Array";
        }
        for (var i = 0; i < msg_dict['items'].length; i++) {
            var item = msg_dict['items'][i];
            if (! ('item_id' in item)) {
                return "item does not have item_id";
            }
            if (typeof item['item_id'] != 'string') {
                return "item_id type";
            }
            if (typeof item['item_id'] != 'string') {
                return "unknown item_id type";
            }
            if (item['item_id'] in item_id_set) {
                return "item_id is not unique in items";
            }
            item_id_set.add(item['item_id']);
            if (! ('name' in item)) {
                return "item does not have name";
            }
            if (typeof item['name'] != 'string') {
                return "unknon item name type";
            }
            if (! ('msats' in item)) {
                return "item does not have msats";
            }
            if (typeof item['msats'] != 'number') {
                return "item msats must be an integer";
            }
            if (item['msats'] < 0) {
                return "item msats must be a positive value";
            }
        }
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_OPINION_SELLER'] = NotifyOpinionSeller;

exports.NotifyOpinionSeller = NotifyOpinionSeller;
