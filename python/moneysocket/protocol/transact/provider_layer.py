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
        self.nexuses_by_shared_seed = {}

    def announce_nexus_from_below_cb(self, below_nexus):
        provider_transact_nexus = ProviderTransactNexus(below_nexus, self)
        self._track_nexus(provider_transact_nexus, below_nexus)
        self._track_nexus_announced(provider_transact_nexus)
        self.announce_nexus_above_cb(provider_transact_nexus)
        shared_seed = provider_transact_nexus.get_shared_seed()
        if shared_seed not in self.nexuses_by_shared_seed:
            self.nexuses_by_shared_seed[shared_seed] = set()
        self.nexuses_by_shared_seed[shared_seed].add(
            provider_transact_nexus.uuid)

    def revoke_nexus_from_below_cb(self, below_nexus):
        provider_transact_nexus = self.nexuses[
            self.nexus_by_below[below_nexus.uuid]]
        super().revoke_nexus_from_below_cb(below_nexus)
        shared_seed = provider_transact_nexus.get_shared_seed()
        self.nexuses_by_shared_seed[shared_seed].remove(
            provider_transact_nexus.uuid)

    def request_invoice_cb(self, provider_transact_nexus, msats, request_uuid):
        self.stack.got_request_invoice_cb(provider_transact_nexus, msats,
                                          request_uuid)

    def request_pay_cb(self, provider_transact_nexus, preimage, request_uuid):
        self.stack.got_request_pay_cb(provider_transact_nexus, preimage,
                                      request_uuid)

    def fulfil_request_invoice(self, nexus_uuid, bolt11,
                               request_reference_uuid):
        if nexus_uuid not in self.nexuses:
            print("no nexus with uuid? %s" % nexus_uuid)
            return
        nexus = self.nexuses[nexus_uuid]
        nexus.notify_invoice(bolt11, request_reference_uuid)

    def notify_preimage(self, shared_seeds, preimage, request_reference_uuid):
        # TODO figure out what nexus matches shared seed
        # have it pass along notify preimage

        for shared_seed in shared_seeds:
            if shared_seed not in self.nexuses_by_shared_seed:
                continue
            for nexus_uuid in self.nexuses_by_shared_seed[shared_seed]:
                nexus = self.nexuses[nexus_uuid]
                nexus.notify_preimage(preimage, request_reference_uuid)
                nexus.notify_provider_info(shared_seed)

    def notify_provider_info(self, shared_seeds):
        for shared_seed in shared_seeds:
            if shared_seed not in self.nexuses_by_shared_seed:
                continue
            for nexus_uuid in self.nexuses_by_shared_seed[shared_seed]:
                nexus = self.nexuses[nexus_uuid]
                nexus.notify_provider_info(shared_seed)
