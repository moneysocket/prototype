# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

class ProtocolNexus(object):
    def __init__(self, below_nexus, layer):
        self.uuid = uuid.uuid4()
        self.below_nexus = below_nexus
        self.layer = layer

        self.upward_recv_cb = None
        self.upward_recv_raw_cb = None

        self.below_nexus.register_upward_recv_cb(self.recv_from_below_cb)
        self.below_nexus.register_upward_recv_raw_cb(
            self.recv_raw_from_below_cb)

    ###########################################################################

    def downward_iter_nexuses(self):
        yield self
        for n in self.below_nexus.downward_iter_nexuses():
            yield n

    def downline_str(self):
        return "\n".join([str(n) for n in self.downward_iter_nexuses()])

    def __str__(self):
        return "%-016s uuid: %s" % (self.__class__.__name__, self.uuid)

    ###########################################################################

    def send(self, msg):
        self.below_nexus.send(msg)

    def send_raw(self, msg_bytes):
        self.below_nexus.send_raw(msg_bytes)

    def initiate_close(self):
        self.below_nexus.initiate_close()

    ###########################################################################

    def recv_from_below_cb(self, below_nexus, msg):
        assert below_nexus.uuid == self.below_nexus.uuid, "crossed nexus?"
        self.upward_recv_cb(self, msg)

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        assert below_nexus.uuid == self.below_nexus.uuid, "crossed nexus?"
        self.upward_recv_raw_cb(self, msg_bytes)

    ###########################################################################

    def register_upward_recv_cb(self, upward_recv_cb):
        self.upward_recv_cb = upward_recv_cb

    def register_upward_recv_raw_cb(self, upward_recv_raw_cb):
        self.upward_recv_raw_cb = upward_recv_raw_cb

    ###########################################################################

    def get_shared_seed(self):
        return self.below_nexus.get_shared_seed()
