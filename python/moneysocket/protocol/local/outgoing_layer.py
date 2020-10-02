# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging

from moneysocket.protocol.layer import ProtocolLayer

from moneysocket.protocol.local.incoming_nexus import IncomingLocalNexus
from moneysocket.protocol.local.outgoing_nexus import OutgoingLocalNexus
from moneysocket.protocol.local.joined_nexus import JoinedLocalNexus
from moneysocket.protocol.local.nexus import LocalNexus


class OutgoingLocalLayer(ProtocolLayer):
    def __init__(self, app, above_layer):
        super().__init__(app, above_layer, "OUTGOING_LOCAL")
        self.incoming_local_layer = None
        self.outgoing_by_shared_seed = {}
        self.incoming_by_shared_seed = {}

    def announce_nexus_from_below_cb(self, below_nexus):
        local_nexus = LocalNexus(below_nexus, self)
        self._track_nexus(local_nexus, below_nexus)
        self._track_nexus_announced(local_nexus)
        self.announce_nexus_above_cb(local_nexus)
        self.notify_app_of_status(nexus, "NEXUS_ANNOUNCED");

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
        self.incoming_local_layer.announce_nexus_from_below_cb(incoming_nexus)
        # outgoing rendezvous nexus will send REQUEST_RENDEZVOUS
        self.announce_nexus_from_below_cb(outgoing_nexus)

    def disconnect(self, shared_seed):

        print("outoing: %s" % self.outgoing_by_shared_seed)
        print("incoiming: %s" % self.incoming_by_shared_seed)

        outgoing_nexus = self.outgoing_by_shared_seed.pop(shared_seed)
        incoming_nexus = self.incoming_by_shared_seed.pop(shared_seed)
        self.incoming_local_layer.revoke_nexus_from_below_cb(incoming_nexus)
        self.revoke_nexus_from_below_cb(outgoing_nexus)
