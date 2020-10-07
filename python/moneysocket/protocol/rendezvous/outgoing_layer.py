# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.rendezvous.outgoing_nexus import (
    OutgoingRendezvousNexus)
from moneysocket.protocol.layer import ProtocolLayer


class OutgoingRendezvousLayer(ProtocolLayer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "OUTGOING_RENDEZVOUS")

    def announce_nexus_from_below_cb(self, below_nexus):
        rendezvous_nexus = OutgoingRendezvousNexus(below_nexus, self)
        self._track_nexus(rendezvous_nexus, below_nexus)

        shared_seed = below_nexus.get_shared_seed()
        rid = shared_seed.derive_rendezvous_id().hex()
        rendezvous_nexus.start_rendezvous(rid, self.rendezvous_finished_cb)

    def rendezvous_finished_cb(self, rendezvous_nexus):
        self._track_nexus_announced(rendezvous_nexus)
        self.notify_app_of_status(rendezvous_nexus, "NEXUS_ANNOUNCED")
        self.announce_nexus_above_cb(rendezvous_nexus)
