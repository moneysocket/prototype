# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.nexus.rendezvous.outgoing import OutgoingRendezvousNexus
from moneysocket.layer.layer import Layer


class OutgoingRendezvousLayer(Layer):
    def __init__(self):
        super().__init__()

    def announce_nexus(self, below_nexus):
        rendezvous_nexus = OutgoingRendezvousNexus(below_nexus, self)
        self._track_nexus(rendezvous_nexus, below_nexus)

        shared_seed = below_nexus.get_shared_seed()
        rid = shared_seed.derive_rendezvous_id().hex()
        rendezvous_nexus.start_rendezvous(rid, self.rendezvous_finished_cb)

    def rendezvous_finished_cb(self, rendezvous_nexus):
        self._track_nexus_announced(rendezvous_nexus)
        self.send_layer_event(rendezvous_nexus, "NEXUS_ANNOUNCED")
        if self.onannounce:
            self.onannounce(rendezvous_nexus)
