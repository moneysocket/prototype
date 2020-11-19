# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.nexus.provider import ProviderNexus
from moneysocket.layer.layer import Layer


class ProviderLayer(Layer):
    def __init__(self):
        super().__init__()
        self.handleproviderinforequest = None
        self.waiting_for_app = {}

    def announce_nexus(self, below_nexus):
        provider_nexus = ProviderNexus(below_nexus, self)
        self._track_nexus(provider_nexus, below_nexus)
        # consumer initiates the handshake, wait for it
        provider_nexus.wait_for_consumer(self.provider_finished_cb)

    def provider_finished_cb(self, provider_nexus):
        self._track_nexus_announced(provider_nexus)
        self.send_layer_event(provider_nexus, "NEXUS_ANNOUNCED");
        self.onannounce(provider_nexus)

    def revoke_nexus(self, below_nexus):
        provider_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        super().revoke_nexus(below_nexus)
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
