# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import sys
import uuid
import logging

from moneysocket.protocol.local.incoming_nexus import IncomingLocalNexus
from moneysocket.protocol.local.outgoing_nexus import OutgoingLocalNexus

class JoinedLocalNexus(object):
    def __init__(self):
        self.uuid = uuid.uuid4()
        self.outgoing_nexus = None
        self.incoming_nexus = None

        self.incoming_upward_recv_cb = None
        self.incoming_upward_recv_raw_cb = None
        self.outgoing_upward_recv_cb = None
        self.outgoing_upward_recv_raw_cb = None

    def set_outgoing_nexus(self, outgoing_nexus):
        self.outgoing_nexus = outgoing_nexus

    def set_incoming_nexus(self, incoming_nexus):
        self.incoming_nexus = incoming_nexus

    ###########################################################################

    def downward_iter_nexuses(self):
        yield self

    def downline_str(self):
        return "\n".join([str(n) for n in self.downward_iter_nexuses()])

    def __str__(self):
        return "%-016s uuid: %s" % (self.__class__.__name__, self.uuid)

    ###########################################################################

    def register_upward_recv_cb(self, upward_recv_cb):
        if upward_recv_cb.__self__.__class__ == IncomingLocalNexus:
            self.incoming_upward_recv_cb = upward_recv_cb
        elif upward_recv_cb.__self__.__class__ == OutgoingLocalNexus:
            self.outgoing_upward_recv_cb = upward_recv_cb
        else:
            sys.exit("can only join incoming and outgoing local nexuses")

    def register_upward_recv_raw_cb(self, upward_recv_raw_cb):
        if upward_recv_raw_cb.__self__.__class__ == IncomingLocalNexus:
            self.incoming_upward_recv_raw_cb = upward_recv_raw_cb
        elif upward_recv_raw_cb.__self__.__class__ == OutgoingLocalNexus:
            self.outgoing_upward_recv_raw_cb = upward_recv_raw_cb
        else:
            sys.exit("can only join incoming and outgoing local nexuses")

    ###########################################################################

    def initiate_close(self):
        self.incoming_nexus.revoke_from_layer()
        self.outgoing_nexus.revoke_from_layer()

    ###########################################################################

    def send_from_incoming(self, msg):
        logging.debug("from incoming: %s" % msg)
        self.outgoing_upward_recv_cb(self, msg)

    def send_raw_from_incoming(self, msg_bytes):
        logging.debug("raw from incoming: %s" % len(msg_bytes))
        self.outgoing_upward_recv_raw_cb(self, msg_bytes)

    ###########################################################################

    def send_from_outgoing(self, msg):
        logging.debug("from outgoing: %s" % msg)
        self.incoming_upward_recv_cb(self, msg)

    def send_raw_from_outgoing(self, msg_bytes):
        logging.debug("raw from outgoing: %s" % len(msg_bytes))
        self.incoming_upward_recv_raw_cb(self, msg_bytes)
