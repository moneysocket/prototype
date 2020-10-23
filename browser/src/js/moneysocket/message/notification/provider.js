// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const BinUtl = require('../../utl/bin.js').BinUtl;
const Uuid = require('../../utl/uuid.js').Uuid;
const MoneysocketNotification = require(
    './notification.js').MoneysocketNotification;

const Wad = require('../../wad/wad.js').Wad;

let NOTIFICATION_SUBCLASSES = require(
    './notification.js').NOTIFICATION_SUBCLASSES;

class NotifyProvider extends MoneysocketNotification {
    constructor(account_uuid, request_reference_uuid, payer, payee, wad) {
        super("NOTIFY_PROVIDER", request_reference_uuid);
        this.account_uuid = account_uuid;
        this.payer = payer
        this.payee = payee
        this.wad = wad
    }

    cryptLevel() {
        return "AES";
    }

    static castClass(msg_dict) {
        var wad;
        if (msg_dict['wad'] != null) {
            wad = Wad.fromDict(msg_dict['wad']);
        } else {
            wad = null;
        }
        var c = new NotifyProvider(msg_dict['account_uuid'],
                                   msg_dict['request_reference_id'],
                                   msg_dict['payer'], msg_dict['payee'], wad);
        Object.keys(msg_dict).forEach(key => {
            if (key != 'wad') {
                c[key] = msg_dict[key];
            }
        });
        return c;
    }

    static checkValidMsgDict(msg_dict) {
        if ( !('account_uuid' in msg_dict)) {
            return "no account_uuid included";
        }
        if (typeof msg_dict['account_uuid'] != 'string') {
            return "unknown account_uuid type";
        }
        if (! Uuid.isUuid(msg_dict['account_uuid'])) {
            return "invalid account_uuid";
        }
        if (typeof msg_dict['payee'] != "boolean") {
            return "payee must be True or False";
        }
        if (typeof msg_dict['payer'] != "boolean") {
            return "payer must be True or False";
        }
        if (msg_dict['wad'] != null) {
            if (typeof msg_dict['wad'] != 'object') {
                return "wad must be a dictionary";
            }
            var err = Wad.validate_wad_dict(msg_dict['wad']);
            if (err != null) {
                return err;
            }
        }
        return null;
    }
}

NOTIFICATION_SUBCLASSES['NOTIFY_PROVIDER'] = NotifyProvider;

exports.NotifyProvider = NotifyProvider;
