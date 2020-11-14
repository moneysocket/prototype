# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging

from moneysocket.layer.layer import Layer

from moneysocket.nexus.local.incoming import IncomingLocalNexus
from moneysocket.nexus.local.outgoing import OutgoingLocalNexus
from moneysocket.nexus.local.joined import JoinedLocalNexus
from moneysocket.nexus.local.local import LocalNexus


class OutgoingLocalLayer(Layer):
    def __init__(self):
        super().__init__()
        self.incoming_local_layer = None
        self.outgoing_by_shared_seed = {}
        self.incoming_by_shared_seed = {}

    def announce_nexus(self, below_nexus):
        local_nexus = LocalNexus(below_nexus, self)
        self._track_nexus(local_nexus, below_nexus)
        self._track_nexus_announced(local_nexus)
        self.send_layer_event(local_nexus, "NEXUS_ANNOUNCED");
        if self.onannounce:
            self.onannounce(local_nexus)

    ###########################################################################

    def set_incoming_layer(self, incoming_local_layer):
        self.incoming_local_layer = incoming_local_layer

    ###########################################################################

    def connect(self, shared_seed):
        # make two nexuses and join them
        joined_nexus = JoinedLocalNexus()
        outgoing_nexus = OutgoingLocalNexus(joined_nexus, self, shared_seed)
        self.outgoing_by_shared_seed[shared_seed] = outgoing_nexus
        incoming_nexus = IncomingLocalNexus(joined_nexus,
                                            self.incoming_local_layer)
        self.incoming_by_shared_seed[shared_seed] = incoming_nexus
        # announce the two nexusues up their two stacks
        # incoming rendezvous nexus will wait for REQUEST_RENDEZVOUS
        self.incoming_local_layer.announce_nexus(incoming_nexus)
        # outgoing rendezvous nexus will send REQUEST_RENDEZVOUS
        self.announce_nexus(outgoing_nexus)

    def disconnect(self, shared_seed):

        print("outoing: %s" % self.outgoing_by_shared_seed)
        print("incoiming: %s" % self.incoming_by_shared_seed)

        outgoing_nexus = self.outgoing_by_shared_seed.pop(shared_seed)
        incoming_nexus = self.incoming_by_shared_seed.pop(shared_seed)
        self.incoming_local_layer.revoke_nexus(incoming_nexus)
        self.revoke_nexus(outgoing_nexus)
