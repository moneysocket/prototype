# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid

from OpenSSL import SSL

from twisted.internet import reactor, ssl

from autobahn.twisted.websocket import connectWS
from autobahn.twisted.websocket import WebSocketClientFactory

from moneysocket.protocol.websocket.nexus import WebsocketNexus
from moneysocket.protocol.websocket.outgoing_socket import OutgoingSocket
from moneysocket.protocol.layer import ProtocolLayer



CONNECTION_ATTEMPT_STATES = {'connecting', 'connected', 'disconnected'}

class MoneysocketConnectionAttempt(object):
    """ object representing an in-progress connection attempt """
    def __init__(self):
        pass

    def get_state(self):
        return "disconnected"

    def stop_connecting(self):
        pass

class WebsocketConnectionAttempt(MoneysocketConnectionAttempt):
    def __init__(self, connector):
        super().__init__()
        self.connector = connector

    def __str__(self):
        destination = self.connector.getDestination()
        return "<%s to %s:%s>" % (
            self.get_state(), destination.host, destination.port)

    def stop_connecting(self):
        self.connector.stopConnecting()

    def get_state(self):
        return self.connector.state


###############################################################################

class OutgoingWebsocketLayer(ProtocolLayer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "OUTGOING_WEBSOCKET")
        self.nexus_by_shared_seed = {}

    def announce_nexus_from_below_cb(self, below_nexus):
        websocket_nexus = WebsocketNexus(below_nexus, self)
        self._track_nexus(websocket_nexus, below_nexus)
        self._track_nexus_announced(websocket_nexus)

        shared_seed = websocket_nexus.get_shared_seed()
        self.nexus_by_shared_seed[shared_seed] = websocket_nexus
        self.notify_app_of_status(websocket_nexus, "NEXUS_ANNOUNCED");
        self.announce_nexus_above_cb(websocket_nexus)

    ###########################################################################

    def _connect(self, websocket_location, shared_seed):
        factory = WebSocketClientFactory(str(websocket_location))
        factory.protocol = OutgoingSocket
        factory.ms_protocol_layer = self
        factory.ms_shared_seed = shared_seed
        logging.info("connecting")
        c = connectWS(factory, timeout=10)
        logging.info("connect: %s" % c)
        return WebsocketConnectionAttempt(c)

    def _connect_tls(self, websocket_location, shared_seed):
        ws_url = str(websocket_location)
        factory = WebSocketClientFactory(ws_url)
        factory.protocol = OutgoingSocket
        factory.ms_protocol_layer = self
        factory.ms_shared_seed = shared_seed
        options = ssl.optionsForClientTLS(hostname=websocket_location.host)
        c = connectWS(factory, options)
        return WebsocketConnectionAttempt(c)

    def connect(self, websocket_location, shared_seed):
        if websocket_location.is_tls():
            return self._connect_tls(websocket_location, shared_seed)
        else:
            return self._connect(websocket_location, shared_seed)

    ###########################################################################

    def disconnect(self, shared_seed):
        if shared_seed not in self.nexus_by_shared_seed:
            return
        websocket_nexus = self.nexus_by_shared_seed[shared_seed]
        websocket_nexus.initiate_close()
