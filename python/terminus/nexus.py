# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

from moneysocket.nexus.nexus import Nexus

from moneysocket.message.notification.preimage import NotifyPreimage
from moneysocket.message.notification.invoice import NotifyInvoice
from moneysocket.message.notification.provider import NotifyProvider

class TerminusNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)

        self.handleinvoicerequest = None
        self.handlepayrequest = None
        self.handleproviderinforequest = None

    ###########################################################################

    def is_layer_message(self, msg):
        if msg['message_class'] != "REQUEST":
            return False
        return msg['request_name'] in {"REQUEST_PAY", "REQUEST_INVOICE"}

    def on_message(self, below_nexus, msg):
        logging.info("terminus nexus got msg")

        if not self.is_layer_message(msg):
            super().on_message(below_nexus, msg)
            return

        request_reference_uuid = msg['request_uuid']
        shared_seed = below_nexus.get_shared_seed()
        if msg['request_name'] == "REQUEST_PAY":
            self.handlepayrequest(shared_seed, msg['bolt11'])
        else:
            msg['request_name'] == "REQUEST_INVOICE"
            assert self.handleinvoicerequest
            invoice_info = self.handleinvoicerequest(shared_seed, msg['msats'])
            m = NotifyInvoice(invoice_info['bolt11'],
                              request_reference_uuid=request_reference_uuid)
            self.send(m)

    def on_bin_message(self, below_nexus, msg_bytes):
        logging.info("terminus nexus got raw msg")
        super().on_bin_message(below_nexus, msg_bytes)


    def notify_preimage(self, preimage, request_reference_uuid=None):
        m = NotifyPreimage(preimage,
                           request_reference_uuid=request_reference_uuid)
        self.send(m)

    def notify_provider_info(self, shared_seed):
        assert self.handleproviderinforequest
        pi = self.handleproviderinforequest(shared_seed);
        m = NotifyProvider(pi['account_uuid'], payer=pi['payer'],
                           payee=pi['payee'], wad=pi['wad'])
        self.send(m)
