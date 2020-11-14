# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import sys

from moneysocket.nexus.nexus import Nexus

from moneysocket.message.codec import MessageCodec

class OutgoingLocalNexus(Nexus):
    def __init__(self, below_nexus, layer, shared_seed):
        super().__init__(below_nexus, layer)
        assert below_nexus.__class__.__name__ == "JoinedLocalNexus"
        below_nexus.set_outgoing_nexus(self)
        self.shared_seed = shared_seed

    ###########################################################################

    def on_message(self, below_nexus, msg):
        logging.info("outgoing local nexus got msg: %s" % msg)
        super().on_message(below_nexus, msg)

    def on_bin_message(self, below_nexus, msg_bytes):
        logging.info("outgoing local nexus got raw msg: %d" % len(msg_bytes))

        msg, err = MessageCodec.wire_decode(msg_bytes,
            shared_seed=self.shared_seed)
        if err:
            logging.error("could not decode msg: %s" % err)
            super().on_bin_message(below_nexus, msg_bytes)
            return
        super().on_message(below_nexus, msg)


    ###########################################################################

    def send(self, msg):
        is_encrypted, msg_or_msg_bytes = MessageCodec.local_encode(msg,
            shared_seed=self.shared_seed)
        if is_encrypted:
            logging.info("sending encrypted: %s" % msg)
            self.send_bin(msg_or_msg_bytes)
        else:
            self.below_nexus.send_from_outgoing(msg_or_msg_bytes)

    def send_bin(self, msg_bytes):
        self.below_nexus.send_bin_from_outgoing(msg_bytes)

    def initiate_close(self):
        self.below_nexus.initiate_close()

    ###########################################################################

    def get_shared_seed(self):
        # this is the bottom
        return self.shared_seed

    ###########################################################################

    def revoke_from_layer(self):
        self.layer.revoke_nexus(self)
