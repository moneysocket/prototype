# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import string
import json
import uuid

from moneysocket.message.notification.notification import (
    MoneysocketNotification)

from moneysocket.wad.wad import Wad

class NotifyProvider(MoneysocketNotification):
    MUST_BE_CLEARTEXT = False

    def __init__(self, account_uuid, request_reference_uuid=None, payer=False,
                 payee=False, wad=None):
        super().__init__("NOTIFY_PROVIDER",
                         request_reference_uuid=request_reference_uuid)
        self['account_uuid'] = str(account_uuid)
        # will this provider pay outgoing invoices
        self['payer'] = payer
        # will this provider generate invoices for incoming payments
        self['payee'] = payee
        # balance to advertize as being available
        self['wad'] = wad

    @staticmethod
    def cast_class(msg_dict):
        c = NotifyProvider(msg_dict['account_uuid'],
            request_reference_uuid=msg_dict['request_reference_uuid'],
            payer=msg_dict['payer'], payee=msg_dict['payee'],
            wad=Wad.from_dict(msg_dict['wad']))
        for key, value in msg_dict.items():
            if (key != 'wad'):
                c[key] = value
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        if 'account_uuid' not in msg_dict.keys():
            return "no account_uuid included"
        if type(msg_dict['account_uuid']) != str:
            return "unknown account_uuid type"
        try:
            _ = uuid.UUID(msg_dict['account_uuid'])
        except Exception as e:
            return "invalid account_uuid"

        if type(msg_dict['payee']) != bool:
            return "payee must be True or False"
        if type(msg_dict['payer']) != bool:
            return "payer must be True or False"

        if msg_dict['wad'] != None:
            if type(msg_dict['wad']) != dict:
                return "wad must be a dictionary"
            err = Wad.validate_wad_dict(msg_dict['wad'])
            if err:
                return err
        return None


MoneysocketNotification.NOTIFICATION_SUBCLASSES['NOTIFY_PROVIDER'] = (
    NotifyProvider)
