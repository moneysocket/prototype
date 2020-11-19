# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging

from moneysocket.nexus.nexus import Nexus
from moneysocket.message.notification.invoice import NotifyInvoice
from moneysocket.message.notification.preimage import NotifyPreimage
from moneysocket.message.notification.provider import NotifyProvider


LAYER_REQUESTS = {"REQUEST_PAY", "REQUEST_INVOICE"}

class ProviderTransactNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        self.handleinvoicerequest = None
        self.handlepayrequest = None

    def handle_layer_request(self, msg):
        if msg['request_name'] == "REQUEST_INVOICE":
            assert self.handleinvoicerequest
            self.handleinvoicerequest(self, msg['msats'], msg['request_uuid'])
        elif msg['request_name'] == "REQUEST_PAY":
            assert self.handlepayrequest
            self.handlepayrequest(self, msg['bolt11'], msg['request_uuid'])

    def is_layer_message(self, msg):
        if msg['message_class'] != "REQUEST":
            return False
        return msg['request_name'] in LAYER_REQUESTS

    def on_message(self, below_nexus, msg):
        if not self.is_layer_message(msg):
            super().on_message(below_nexus, msg)
            return
        self.handle_layer_request(msg)

    def on_bin_message(self, below_nexus, msg_bytes):
        pass

    def notify_invoice(self, bolt11, request_reference_uuid):
        self.send(NotifyInvoice(bolt11, request_reference_uuid))

    def notify_preimage(self, preimage, request_reference_uuid):
        self.send(NotifyPreimage(preimage, None, request_reference_uuid))

    def notify_provider_info(self, shared_seed):
        assert self.layer.handleproviderinforequest
        pi = self.layer.handleproviderinforequest(shared_seed)

        logging.info("NOYIFY PROVIDER: %s" % pi['wad'])
        m = NotifyProvider(pi['account_uuid'], payer=pi['payer'],
                           payee=pi['payee'], wad=pi['wad'])
        self.send(m)
