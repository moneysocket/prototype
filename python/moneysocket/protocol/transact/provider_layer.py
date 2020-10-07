# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.layer import ProtocolLayer
from moneysocket.protocol.transact.provider_nexus import ProviderTransactNexus


class ProviderTransactLayer(ProtocolLayer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "PROVIDER_TRANSACT")
        assert "got_request_pay_cb" in dir(stack)
        assert "got_request_invoice_cb" in dir(stack)

    def announce_nexus_from_below_cb(self, below_nexus):
        provider_transact_nexus = ProviderTransactNexus(below_nexus, self)
        self._track_nexus(provider_transact_nexus, below_nexus)
        self._track_nexus_announced(provider_transact_nexus)
        self.announce_nexus_above_cb(provider_transact_nexus)

    def request_invoice_cb(self, provider_transact_nexus, msats, request_uuid):
        self.stack.got_request_invoice_cb(msats, request_uuid)

    def request_pay_cb(self, provider_transact_nexus, preimage, request_uuid):
        self.stack.got_request_pay_cb(preimage, request_uuid)
