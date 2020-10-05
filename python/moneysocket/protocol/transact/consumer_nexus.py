# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying#  file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.nexus import ProtocolNexus

from moneysocket.message.request.invoice import RequestInvoice
from moneysocket.message.request.pay import RequestPay

class ConsumerTransactNexus(ProtocolNexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        assert "notify_preimage_cb" in dir(layer)
        assert "notify_invoice_cb" in dir(layer)

    def handle_layer_notification(self, msg):
        if msg['notification_name'] == "NOTIFY_INVOICE":
            self.layer.notify_invoice_cb(self, msg['bolt11'],
                                         msg['request_reference_uuid'])
        elif msg['notification_name'] == "NOTIFY_PREIMAGE":
            self.layer.notify_preimage_cb(self, msg['preimage'],
                                          msg['request_reference_uuid'])

    def is_layer_message(self, msg):
        if msg['message_class'] != "NOTIFICATION":
            return False
        return msg['notification_name'] in {'NOTIFY_INVOICE', 'NOTIFY_PREIMAGE'}

    def recv_from_below_cb(self, below_nexus, msg):
        if not self.is_layer_message(msg):
            super().recv_from_below_cb(below_nexus, msg)
            return
        self.handle_layer_notification(msg)

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        pass

    def request_invoice(self, msats, override_request_uuid, description):
        ri = RequestInvoice(msats)
        if override_request_uuid:
            ri['request_uuid'] = override_request_uuid
        self.send(ri)

    def request_pay(self, bolt11, override_request_uuid):
        rp = RequestPay(bolt11)
        if override_request_uuid:
            rp['request_uuid'] = override_request_uuid;
        self.send(rp)

