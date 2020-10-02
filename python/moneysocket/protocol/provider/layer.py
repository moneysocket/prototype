# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.provider.nexus import ProviderNexus
from moneysocket.protocol.layer import ProtocolLayer


class ProviderLayer(ProtocolLayer):
    def __init__(self, app, above_layer):
        super().__init__(app, above_layer, "PROVIDER")
        assert "get_provider_info" in dir(app)
        self.waiting_for_app = {}

    def announce_nexus_from_below_cb(self, below_nexus):
        provider_nexus = ProviderNexus(below_nexus, self)
        self._track_nexus(provider_nexus, below_nexus)
        # consumer initiates the handshake, wait for it
        provider_nexus.wait_for_consumer(self.provider_finished_cb)

    def provider_finished_cb(self, provider_nexus):
        self._track_nexus_announced(provider_nexus)
        self.notify_app_of_status(provider_nexus, "NEXUS_ANNOUNCED");
        self.announce_nexus_above_cb(provider_nexus)

    def revoke_nexus_from_below_cb(self, below_nexus):
        provider_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        super().revoke_nexus_from_below_cb(below_nexus)
        shared_seed = provider_nexus.get_shared_seed()
        _ = self.waiting_for_app.pop(shared_seed, None)

    def nexus_waiting_for_app(self, shared_seed, provider_nexus):
        # nexus is letting us know it can't finish the handshake until the
        # app is ready
        self.waiting_for_app[shared_seed] = provider_nexus

    def provider_now_ready_from_app(self, shared_seed):
        provider_nexus = self.waiting_for_app.pop(shared_seed, None)
        if provider_nexus:
            provider_nexus.provider_now_ready()
