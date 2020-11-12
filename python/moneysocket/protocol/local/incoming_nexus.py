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

    def recv_from_below_cb(self, below_nexus, msg):
        logging.info("incoming local nexus got msg")
        super().recv_from_below_cb(below_nexus, msg)

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        logging.info("incoming local nexus got raw msg")
        super().recv_raw_from_below_cb(below_nexus, msg_bytes)

    ###########################################################################

    def send(self, msg):
        self.below_nexus.send_from_incoming(msg)

    def send_raw(self, msg_bytes):
        self.below_nexus.send_raw_from_incoming(msg_bytes)

    def initiate_close(self):
        self.below_nexus.initiate_close()

    ###########################################################################

    def revoke_from_layer(self):
        self.layer.revoke_nexus_from_below_cb(self)
