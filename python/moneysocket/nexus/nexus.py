# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

class Nexus(object):
    def __init__(self, below_nexus, layer):
        self.uuid = uuid.uuid4()
        self.below_nexus = below_nexus
        self.layer = layer
        self.onmessage = None
        self.onbinmessage = None
        self.register_above_nexus(below_nexus)

    def register_above_nexus(self, below_nexus):
        below_nexus.onmessage = self.on_message
        below_nexus.onbinmessage = self.on_bin_message

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

    def send_bin(self, msg_bytes):
        self.below_nexus.send_bin(msg_bytes)

    def initiate_close(self):
        self.below_nexus.initiate_close()

    ###########################################################################

    def on_message(self, below_nexus, msg):
        assert below_nexus.uuid == self.below_nexus.uuid, "crossed nexus?"
        if self.onmessage:
            self.onmessage(self, msg)

    def on_bin_message(self, below_nexus, msg_bytes):
        assert below_nexus.uuid == self.below_nexus.uuid, "crossed nexus?"
        if self.onbinmessage:
            self.onbinmessage(self, msg_bytes)

    ###########################################################################

    def get_shared_seed(self):
        return self.below_nexus.get_shared_seed()
