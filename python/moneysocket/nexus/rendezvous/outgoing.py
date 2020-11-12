# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

from moneysocket.nexus.nexus import Nexus

from moneysocket.message.request.rendezvous import RequestRendezvous

class OutgoingRendezvousNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        self.rendezvous_finished_cb = None

    ###########################################################################

    def is_layer_message(self, msg):
        if msg['message_class'] != "NOTIFICATION":
            return False
        return msg['notification_name'] in {"NOTIFY_RENDEZVOUS",
                                            "NOTIFY_RENDEZVOUS_NOT_READY",
                                            "NOTIFY_RENDEZVOUS_END"}

    def recv_from_below_cb(self, below_nexus, msg):
        logging.info("outgoing rdv nexus got msg: %s" % msg)
        if not self.is_layer_message(msg):
            # pass on to above
            super().recv_from_below_cb(below_nexus, msg)
            return

        if msg['notification_name'] == "NOTIFY_RENDEZVOUS":
            logging.info("rendezvous ready, notifying")
            self.rendezvous_finished_cb(self)
        elif msg['notification_name'] == "NOTIFY_RENDEZVOUS_NOT_READY":
            logging.info("rendezvous not ready, waiting")
        elif msg['notification_name'] == "NOTIFY_RENDEZVOUS_END":
            logging.info("rendezvous ended")
            self.initiate_close()

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        logging.info("rdv nexus got raw msg")


    ###########################################################################

    def start_rendezvous(self, rendezvous_id, rendezvous_finished_cb):
        self.rendezvous_finished_cb = rendezvous_finished_cb
        self.send(RequestRendezvous(rendezvous_id))
