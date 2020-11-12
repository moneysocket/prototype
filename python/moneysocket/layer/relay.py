# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import logging

from moneysocket.layer.layer import Layer

class RelayLayer(Layer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "RELAY")
        self.rendezvous_layer = None

    def set_rendezvous_layer(self, rendezvous_layer):
        self.rendezvous_layer = rendezvous_layer

    ###########################################################################

    def announce_nexus_from_below_cb(self, rendezvous_nexus):
        logging.info("announced from below")
        rendezvous_nexus.register_upward_recv_cb(self.recv_from_below_cb)
        rendezvous_nexus.register_upward_recv_raw_cb(
            self.recv_raw_from_below_cb)

    def revoke_nexus_from_below_cb(self, rendezvous_nexus):
        logging.info("revoked from below")

    ###########################################################################

    def recv_from_below_cb(self, rendezvous_nexus, msg):
        peer_nexus = self.rendezvous_layer.get_peer_nexus(rendezvous_nexus)
        peer_nexus.send(msg)

    def recv_raw_from_below_cb(self, rendezvous_nexus, msg_bytes):
        peer_nexus = self.rendezvous_layer.get_peer_nexus(rendezvous_nexus)
        peer_nexus.send_raw(msg_bytes)
