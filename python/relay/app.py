# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import logging
from configparser import ConfigParser
from OpenSSL import SSL

from twisted.internet import reactor
from twisted.internet.task import LoopingCall

from moneysocket.layer.websocket.incoming import IncomingWebsocketLayer
from moneysocket.layer.rendezvous.incoming import IncomingRendezvousLayer
from moneysocket.layer.relay import RelayLayer


class Relay(object):
    def __init__(self, config):
        self.config = config

        # TODO - this could/should be extracted into a Stack class, though
        # the relay app is small and straightforward like this, so no rush.
        self.websocket_layer = self.setup_websocket_layer()
        self.rendezvous_layer = self.setup_rendezvous_layer(
            self.websocket_layer)
        self.relay_layer = self.setup_relay_layer(self.rendezvous_layer)

        self.listen_url = self.get_listen_url(self.config['Relay'])
        self.tls_info = self.get_tls_info(self.config['Relay'])

        self.info_loop = LoopingCall(self.output_info)
        self.info_loop.start(2.0, now=False)

    ###########################################################################

    def setup_relay_layer(self, rendezvous_layer):
        l = RelayLayer()
        l.register_above_layer(rendezvous_layer)
        l.register_layer_event(self.on_stack_event, "RELAY")
        l.set_rendezvous_layer(rendezvous_layer)
        return l

    def setup_rendezvous_layer(self, below_layer):
        l = IncomingRendezvousLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.on_stack_event, "INCOMING_RENDEZVOUS")
        return l

    def setup_websocket_layer(self):
        l = IncomingWebsocketLayer()
        l.register_layer_event(self.on_stack_event, "INCOMING_WEBSOCKET")
        return l

    ###########################################################################

    def on_stack_event(self, layer_name, nexus, status):
        pass

    ###########################################################################

    def output_info(self):
        logging.info(str(self.rendezvous_layer))

    def get_listen_url(self, config_section):
        bind = config_section['ListenBind']
        port = int(config_section['ListenPort'])
        prefix = "wss" if config_section['UseTLS'] == "True" else "ws"
        return "%s://%s:%d" % (prefix, bind, port)

    def get_tls_info(self, config_section):
        if config_section['UseTLS'] != "True":
            return None
        tls_info = {'sslmethod': SSL.TLSv1_2_METHOD,
                    'cert_file': os.path.abspath(config_section['CertFile']),
                    'key_file':  os.path.abspath(config_section['CertKey'])}
        tls_info['cert_chain_file'] = (
            os.path.abspath(config_section['CertChainFile']) if
            config_section['SelfSignedCert'] == "False" else None)
        return tls_info

    ###########################################################################

    def run_app(self):
        print("listening at: %s" % self.listen_url)
        self.websocket_layer.listen(self.listen_url, tls_info=self.tls_info)
