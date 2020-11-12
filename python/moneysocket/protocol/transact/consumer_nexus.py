# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying#  file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.nexus.nexus import Nexus

from moneysocket.message.request.invoice import RequestInvoice
from moneysocket.message.request.pay import RequestPay

class ConsumerTransactNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        assert "notify_provider_cb" in dir(layer)
        assert "notify_preimage_cb" in dir(layer)
        assert "notify_invoice_cb" in dir(layer)

    def handle_layer_notification(self, msg):
        if msg['notification_name'] == "NOTIFY_INVOICE":
            self.layer.notify_invoice_cb(self, msg['bolt11'],
                                         msg['request_reference_uuid'])
        elif msg['notification_name'] == "NOTIFY_PREIMAGE":
            self.layer.notify_preimage_cb(self, msg['preimage'],
                                          msg['request_reference_uuid'])
        elif msg['notification_name'] == "NOTIFY_PROVIDER":
            self.layer.notify_provider_cb(self, msg)

    def is_layer_message(self, msg):
        if msg['message_class'] != "NOTIFICATION":
            return False
        return msg['notification_name'] in {'NOTIFY_INVOICE', 'NOTIFY_PREIMAGE',
                                            'NOTIFY_PROVIDER'}

    def recv_from_below_cb(self, below_nexus, msg):
        if not self.is_layer_message(msg):
            super().recv_from_below_cb(below_nexus, msg)
            return
        self.handle_layer_notification(msg)

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        pass

    def request_invoice(self, msats, description):
        # TODO: description
        ri = RequestInvoice(msats)
        self.send(ri)
        return ri['request_uuid']

    def request_pay(self, bolt11):
        rp = RequestPay(bolt11)
        self.send(rp)
        return rp['request_uuid']

