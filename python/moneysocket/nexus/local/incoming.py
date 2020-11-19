# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import sys

from moneysocket.nexus.nexus import Nexus


class IncomingLocalNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        assert below_nexus.__class__.__name__ == "JoinedLocalNexus"
        below_nexus.set_incoming_nexus(self)

    ###########################################################################

    def on_message(self, below_nexus, msg):
        logging.info("incoming local nexus got msg")
        super().on_message(below_nexus, msg)

    def on_bin_message(self, below_nexus, msg_bytes):
        logging.info("incoming local nexus got raw msg")
        super().on_bin_message(below_nexus, msg_bytes)

    ###########################################################################

    def send(self, msg):
        self.below_nexus.send_from_incoming(msg)

    def send_bin(self, msg_bytes):
        self.below_nexus.send_bin_from_incoming(msg_bytes)

    def initiate_close(self):
        self.below_nexus.initiate_close()

    ###########################################################################

    def revoke_from_layer(self):
        self.layer.revoke_nexus(self)
