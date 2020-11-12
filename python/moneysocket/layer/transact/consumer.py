# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying#  file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.layer.layer import Layer
from moneysocket.nexus.transact.consumer import ConsumerTransactNexus


class ConsumerTransactLayer(Layer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "CONSUMER_TRANSACT")
        assert "notify_preimage_cb" in dir(stack)
        assert "notify_invoice_cb" in dir(stack)
        assert "notify_provider_cb" in dir(stack)

    def announce_nexus_from_below_cb(self, below_nexus):
        consumer_transact_nexus = ConsumerTransactNexus(below_nexus, self)
        self._track_nexus(consumer_transact_nexus, below_nexus)
        self._track_nexus_announced(consumer_transact_nexus)
        self.notify_app_of_status(consumer_transact_nexus, "NEXUS_ANNOUNCED")
        self.announce_nexus_above_cb(consumer_transact_nexus)

    def notify_invoice_cb(self, consumer_transact_nexus, bolt11,
                          request_reference_uuid):
        self.stack.notify_invoice_cb(consumer_transact_nexus, bolt11,
                                     request_reference_uuid)

    def notify_preimage_cb(self, consumer_transact_nexus, preimage,
                           request_reference_uuid):
        self.stack.notify_preimage_cb(consumer_transact_nexus, preimage,
                                      request_reference_uuid)

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

    def notify_provider_cb(self, consumer_transact_nexus, msg):
        self.stack.notify_provider_cb(consumer_transact_nexus, msg)
