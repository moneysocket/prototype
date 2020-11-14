# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.nexus.consumer import ConsumerNexus
from moneysocket.layer.layer import Layer


class ConsumerLayer(Layer):
    def __init__(self):
        super().__init__()
        self.onping = None
        self.waiting_for_app = {}

    def announce_nexus(self, below_nexus):
        consumer_nexus = self.setup_consumer_nexus(below_nexus)
        self._track_nexus(consumer_nexus, below_nexus)
        consumer_nexus.start_handshake(self.consumer_finished_cb)

    def setup_consumer_nexus(self, below_nexus):
        n = ConsumerNexus(below_nexus, self)
        n.onping = self.on_ping
        return n

    def revoke_nexus(self, below_nexus):
        consumer_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        super().revoke_nexus(below_nexus)
        consumer_nexus.stop_pinging()

    def consumer_finished_cb(self, consumer_nexus):
        self._track_nexus_announced(consumer_nexus)
        self.send_layer_event(consumer_nexus, "NEXUS_ANNOUNCED")
        if self.onannounce:
            self.onannounce(consumer_nexus)

    def on_ping(self, consumer_nexus, msecs):
        if self.onping:
            self.onping(consumer_nexus, msecs)
