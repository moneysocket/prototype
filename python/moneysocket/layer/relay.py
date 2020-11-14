# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import logging

from moneysocket.layer.layer import Layer

class RelayLayer(Layer):
    def __init__(self):
        super().__init__()
        self.rendezvous_layer = None

    def set_rendezvous_layer(self, rendezvous_layer):
        self.rendezvous_layer = rendezvous_layer

    ###########################################################################

    def announce_nexus(self, rendezvous_nexus):
        logging.info("announced from below")
        rendezvous_nexus.onmessage = self.on_message
        rendezvous_nexus.onbinmessage = self.on_bin_message

    def revoke_nexus(self, rendezvous_nexus):
        logging.info("revoked from below")

    ###########################################################################

    def on_message(self, rendezvous_nexus, msg):
        peer_nexus = self.rendezvous_layer.get_peer_nexus(rendezvous_nexus)
        peer_nexus.send(msg)

    def on_bin_message(self, rendezvous_nexus, msg_bytes):
        peer_nexus = self.rendezvous_layer.get_peer_nexus(rendezvous_nexus)
        peer_nexus.send_bin(msg_bytes)
