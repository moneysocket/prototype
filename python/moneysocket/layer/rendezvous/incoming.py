# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.layer.layer import Layer
from moneysocket.layer.rendezvous.directory import RendezvousDirectory
from moneysocket.nexus.rendezvous.incoming import IncomingRendezvousNexus


class IncomingRendezvousLayer(Layer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "INCOMING_RENDEZVOUS")
        self.directory = RendezvousDirectory()

    def __str__(self):
        return str(self.directory)

    def announce_nexus_from_below_cb(self, below_nexus):
        rendezvous_nexus = IncomingRendezvousNexus(below_nexus, self)
        self._track_nexus(rendezvous_nexus, below_nexus)
        rendezvous_nexus.wait_for_rendezvous(self.rendezvous_finished_cb)

    def rendezvous_finished_cb(self, rendezvous_nexus):
        self._track_nexus_announced(rendezvous_nexus)
        self.notify_app_of_status(rendezvous_nexus, "NEXUS_ANNOUNCED");
        self.announce_nexus_above_cb(rendezvous_nexus)

    def revoke_nexus_from_below_cb(self, below_nexus):
        rendezvous_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        peer_rendezvous_nexus = self.directory.get_peer_nexus(rendezvous_nexus)
        super().revoke_nexus_from_below_cb(below_nexus)
        self.directory.remove_nexus(rendezvous_nexus)

        if peer_rendezvous_nexus:
            peer_rendezvous_nexus.end_rendezvous()

    def get_peer_nexus(self, rendezvous_nexus):
        return self.directory.get_peer_nexus(rendezvous_nexus)
