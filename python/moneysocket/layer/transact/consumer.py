# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying#  file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.layer.layer import Layer
from moneysocket.nexus.transact.consumer import ConsumerTransactNexus


class ConsumerTransactLayer(Layer):
    def __init__(self):
        super().__init__()
        self.oninvoice = None
        self.onpreimage = None
        self.onproviderinfo = None

    def announce_nexus(self, below_nexus):
        consumer_transact_nexus = self.setup_consumer_transact_nexus(
            below_nexus)
        self._track_nexus(consumer_transact_nexus, below_nexus)
        self._track_nexus_announced(consumer_transact_nexus)
        self.send_layer_event(consumer_transact_nexus, "NEXUS_ANNOUNCED")
        if self.onannounce:
            self.onannounce(consumer_transact_nexus)

    def setup_consumer_transact_nexus(self, below_nexus):
        n = ConsumerTransactNexus(below_nexus, self)
        n.oninvoice = self.on_invoice
        n.onpreimage = self.on_preimage
        n.onproviderinfo = self.on_provider_info
        return n

    def on_invoice(self, consumer_transact_nexus, bolt11,
                   request_reference_uuid):
        if self.oninvoice:
            self.oninvoice(consumer_transact_nexus, bolt11,
                           request_reference_uuid)

    def on_preimage(self, consumer_transact_nexus, preimage,
                    request_reference_uuid):
        if self.onpreimage:
            self.onpreimage(consumer_transact_nexus, preimage,
                            request_reference_uuid)

    def on_provider_info(self, consumer_transact_nexus, msg):
        if self.onproviderinfo:
            self.onproviderinfo(consumer_transact_nexus, msg)

    def request_invoice(self, nexus_uuid, msats, description):
        if nexus_uuid not in self.nexuses:
            return None, "nexus not online"
        nexus = self.nexuses[nexus_uuid]
        request_uuid = nexus.request_invoice(msats, "")
        return request_uuid, None

    def request_pay(self, nexus_uuid, bolt11):
        if nexus_uuid not in self.nexuses:
            return None, "nexus not online"
        nexus = self.nexuses[nexus_uuid]
        request_uuid = nexus.request_pay(bolt11)
        return request_uuid, None
