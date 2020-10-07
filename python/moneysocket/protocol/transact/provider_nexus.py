# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.nexus import ProtocolNexus
from moneysocket.message.notification.invoice import NotifyInvoice
from moneysocket.message.notification.preimage import NotifyPreimage


LAYER_REQUESTS = {"REQUEST_PAY", "REQUEST_INVOICE"}

class ProviderTransactNexus(ProtocolNexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        assert "request_invoice_cb" in dir(self.layer)
        assert "request_pay_cb" in dir(self.layer)

    def handle_layer_request(self, msg):
        if msg['request_name'] == "REQUEST_INVOICE":
            self.layer.request_invoice_cb(self, msg['msats'],
                                          msg['request_uuid'])
        elif msg['request_name'] == "REQUEST_PAY":
            self.layer.request_pay_cb(self, msg['bolt11'], msg['request_uuid'])

    def is_layer_message(self, msg):
        if msg['message_class'] != "REQUEST":
            return False
        return msg['request_name'] in LAYER_REQUESTS

    def recv_from_below_cb(self, below_nexus, msg):
        if not self.is_layer_message(msg):
            super().recv_from_below_cb(below_nexus, msg)
            return
        self.handle_layer_request(msg)

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        pass

    def notify_invoice(self, bolt11, request_reference_uuid):
        self.send(NotifyInvoice(bolt11, request_reference_uuid))

    def notify_preimage(self, preimage, request_reference_uuid):
        self.send(NotifyPreimage(preimage, None, request_reference_uuid))
