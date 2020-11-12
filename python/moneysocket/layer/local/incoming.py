# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging

from moneysocket.layer.layer import Layer
from moneysocket.nexus.local.local import LocalNexus


class IncomingLocalLayer(Layer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "INCOMING_LOCAL")

    def announce_nexus_from_below_cb(self, below_nexus):
        local_nexus = LocalNexus(below_nexus, self)
        self._track_nexus(local_nexus, below_nexus)
        self._track_nexus_announced(local_nexus)
        self.notify_app_of_status(local_nexus, "NEXUS_ANNOUNCED");
        self.announce_nexus_above_cb(local_nexus)
