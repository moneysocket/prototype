# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.consumer.nexus import ConsumerNexus
from moneysocket.protocol.layer import ProtocolLayer


class ConsumerLayer(ProtocolLayer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "CONSUMER")
        assert "notify_provider_cb" in dir(stack)
        assert "notify_ping_cb" in dir(stack)
        self.waiting_for_app = {}

    def announce_nexus_from_below_cb(self, below_nexus):
        consumer_nexus = ConsumerNexus(below_nexus, self)
        self._track_nexus(consumer_nexus, below_nexus)
        consumer_nexus.start_handshake(self.consumer_finished_cb)

    def revoke_nexus_from_below_cb(self, below_nexus):
        consumer_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        super().revoke_nexus_from_below_cb(below_nexus)
        consumer_nexus.stop_pinging()

    def consumer_finished_cb(self, consumer_nexus):
        self._track_nexus_announced(consumer_nexus)
        self.notify_app_of_status(consumer_nexus, "NEXUS_ANNOUNCED")
        self.announce_nexus_above_cb(consumer_nexus)

    def notify_provider_cb(self, consumer_nexus, msg):
        self.stack.notify_provider_cb(consumer_nexus, msg)

    def notify_ping_cb(self, consumer_nexus, msecs):
        self.stack.notify_ping_cb(consumer_nexus, msecs)
