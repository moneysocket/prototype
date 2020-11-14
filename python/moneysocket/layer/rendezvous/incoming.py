# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.layer.layer import Layer
from moneysocket.layer.rendezvous.directory import RendezvousDirectory
from moneysocket.nexus.rendezvous.incoming import IncomingRendezvousNexus


class IncomingRendezvousLayer(Layer):
    def __init__(self):
        super().__init__()
        self.directory = RendezvousDirectory()

    def __str__(self):
        return str(self.directory)

    def announce_nexus(self, below_nexus):
        rendezvous_nexus = IncomingRendezvousNexus(below_nexus, self)
        self._track_nexus(rendezvous_nexus, below_nexus)
        rendezvous_nexus.wait_for_rendezvous(self.rendezvous_finished_cb)

    def rendezvous_finished_cb(self, rendezvous_nexus):
        self._track_nexus_announced(rendezvous_nexus)
        self.send_layer_event(rendezvous_nexus, "NEXUS_ANNOUNCED");
        if self.onannounce:
            self.onannounce(rendezvous_nexus)

    def revoke_nexus(self, below_nexus):
        rendezvous_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        peer_rendezvous_nexus = self.directory.get_peer_nexus(rendezvous_nexus)
        super().revoke_nexus(below_nexus)
        self.directory.remove_nexus(rendezvous_nexus)

        if peer_rendezvous_nexus:
            peer_rendezvous_nexus.end_rendezvous()

    def get_peer_nexus(self, rendezvous_nexus):
        return self.directory.get_peer_nexus(rendezvous_nexus)
