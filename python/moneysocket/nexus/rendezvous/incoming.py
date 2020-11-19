# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

from moneysocket.nexus.nexus import Nexus

from moneysocket.message.notification.rendezvous import NotifyRendezvous
from moneysocket.message.notification.rendezvous_not_ready import (
    NotifyRendezvousNotReady)
from moneysocket.message.notification.rendezvous_end import NotifyRendezvousEnd

class IncomingRendezvousNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        self.rendezvous_finished_cb = None
        self.request_reference_uuid = None
        self.rendezvous_id = None
        self.directory = layer.directory

    ###########################################################################

    def is_layer_message(self, msg):
        if msg['message_class'] != "REQUEST":
            return False
        return msg['request_name'] in {"REQUEST_RENDEZVOUS"}

    def on_message(self, below_nexus, msg):
        logging.info("rdv nexus got msg")
        if not self.is_layer_message(msg):
            # pass on to above
            super().on_message(below_nexus, msg)
            return

        assert msg['request_name'] == "REQUEST_RENDEZVOUS"
        self.rendezvous_id = msg['rendezvous_id']
        self.request_reference_uuid = msg['request_uuid']

        if self.directory.is_rid_peered(self.rendezvous_id):
            self.initiate_close()
            pass
        self.directory.add_nexus(self, self.rendezvous_id)
        peer = self.directory.get_peer_nexus(self)
        if peer:
            n = NotifyRendezvous(self.rendezvous_id,
                                 self.request_reference_uuid)
            self.send(n)
            self.rendezvous_finished_cb(self)
            peer.rendezvous_achieved()
        else:
            n = NotifyRendezvousNotReady(self.rendezvous_id,
                                         self.request_reference_uuid)
            self.send(n)


    def on_bin_message(self, below_nexus, msg_bytes):
        logging.info("rdv nexus got raw msg")
        super().on_bin_message(below_nexus, msg_bytes)


    ###########################################################################

    def wait_for_rendezvous(self, rendezvous_finished_cb):
        self.rendezvous_finished_cb = rendezvous_finished_cb

    def rendezvous_achieved(self):
        assert self.directory.is_rid_peered(self.rendezvous_id)
        n = NotifyRendezvous(self.rendezvous_id, self.request_reference_uuid)
        self.send(n)
        self.rendezvous_finished_cb(self)

    def end_rendezvous(self):
        self.directory.remove_nexus(self)
        n = NotifyRendezvousEnd(self.rendezvous_id)
        self.send(n)
