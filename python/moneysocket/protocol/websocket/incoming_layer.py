# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import logging
import uuid

from OpenSSL import SSL

from twisted.internet import reactor, ssl

from autobahn.twisted.websocket import listenWS
from autobahn.twisted.websocket import WebSocketServerFactory
from autobahn.twisted.websocket import WebSocketServerProtocol

from moneysocket.protocol.websocket.nexus import WebsocketNexus
from moneysocket.protocol.websocket.incoming_socket import IncomingSocket
from moneysocket.layer.layer import Layer


###############################################################################

class IncomingWebsocketLayer(Layer):
    def __init__(self, stack, above_layer):
        super().__init__(stack, above_layer, "INCOMING_WEBSOCKET")
        self.listener = None

    def announce_nexus_from_below_cb(self, below_nexus):
        websocket_nexus = WebsocketNexus(below_nexus, self)
        self._track_nexus(websocket_nexus, below_nexus)
        self._track_nexus_announced(websocket_nexus)
        self.notify_app_of_status(websocket_nexus, "NEXUS_ANNOUNCED");
        self.announce_nexus_above_cb(websocket_nexus)

    def stop_listening(self):
        if not self.listener:
            return
        logging.info("stopping listening")
        self.listener.stopListening()

    def listen(self, listen_ws_url, tls_info=None):
        if listen_ws_url.startswith("wss") and not tls_info:
            return "must specify tls_info to listen with TLS"

        if tls_info:
            logging.info("listening with TLS %s" % tls_info)
            contextFactory = ssl.DefaultOpenSSLContextFactory(
                tls_info['key_file'], tls_info['cert_file'],
                sslmethod=tls_info['sslmethod'])

            if tls_info['cert_chain_file']:
                ctx = contextFactory.getContext()
                ctx.use_certificate_chain_file(tls_info['cert_chain_file'])

            factory = WebSocketServerFactory(listen_ws_url)
            factory.protocol = IncomingSocket
            factory.setProtocolOptions(openHandshakeTimeout=30,
                                       autoPingInterval=30,
                                       autoPingTimeout=5)
            factory.ms_protocol_layer = self
            factory.ms_shared_seed = None
            self.listener = listenWS(factory, contextFactory)
        else:
            logging.info("listening without TLS")
            port = int(listen_ws_url.split(":")[-1])
            factory = WebSocketServerFactory(listen_ws_url)
            factory.protocol = IncomingSocket
            factory.ms_protocol_layer = self
            factory.ms_shared_seed = None
            self.listener = reactor.listenTCP(port, factory)
        return None





