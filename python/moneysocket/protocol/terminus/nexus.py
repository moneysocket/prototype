# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

from moneysocket.protocol.nexus import ProtocolNexus

from moneysocket.message.notification.preimage import NotifyPreimage
from moneysocket.message.notification.invoice import NotifyInvoice
from moneysocket.message.notification.provider import NotifyProvider

class TerminusNexus(ProtocolNexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)

    ###########################################################################

    def is_layer_message(self, msg):
        if msg['message_class'] != "REQUEST":
            return False
        return msg['request_name'] in {"REQUEST_PAY", "REQUEST_INVOICE"}

    def recv_from_below_cb(self, below_nexus, msg):
        logging.info("terminus nexus got msg")

        if not self.is_layer_message(msg):
            super().recv_from_below_cb(below_nexus, msg)
            return

        request_reference_uuid = msg['request_uuid']
        shared_seed = below_nexus.get_shared_seed()
        if msg['request_name'] == "REQUEST_PAY":
            self.layer.app.terminus_request_pay(shared_seed, msg['bolt11'])
        else:
            msg['request_name'] == "REQUEST_INVOICE"
            invoice_info = self.layer.app.terminus_request_invoice(
                shared_seed, msg['msats'])
            m = NotifyInvoice(invoice_info['bolt11'],
                              request_reference_uuid=request_reference_uuid)
            self.send(m)

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        logging.info("terminus nexus got raw msg")
        super().recv_raw_from_below_cb(below_nexus, msg_bytes)


    def notify_preimage(self, preimage, request_reference_uuid=None):
        m = NotifyPreimage(preimage,
                           request_reference_uuid=request_reference_uuid)
        self.send(m)

    def notify_provider_info(self, shared_seed):
        pi = self.layer.app.get_provider_info(shared_seed)
        m = NotifyProvider(pi['provider_uuid'], payer=pi['payer'],
                           payee=pi['payee'], msats=pi['msats'])
        self.send(m)
