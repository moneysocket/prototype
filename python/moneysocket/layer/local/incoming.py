# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging

from moneysocket.layer.layer import Layer
from moneysocket.nexus.local.local import LocalNexus


class IncomingLocalLayer(Layer):
    def __init__(self):
        super().__init__()

    def announce_nexus(self, below_nexus):
        local_nexus = LocalNexus(below_nexus, self)
        self._track_nexus(local_nexus, below_nexus)
        self._track_nexus_announced(local_nexus)
        self.send_layer_event(local_nexus, "NEXUS_ANNOUNCED");
        if self.onannounce:
            self.onannounce(local_nexus)
