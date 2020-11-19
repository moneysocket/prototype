# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import logging

from OpenSSL import SSL

from moneysocket.layer.relay import RelayLayer
from moneysocket.layer.websocket.incoming import IncomingWebsocketLayer
from moneysocket.layer.rendezvous.incoming import IncomingRendezvousLayer
from moneysocket.layer.local.incoming import IncomingLocalLayer
from moneysocket.beacon.location.websocket import WebsocketLocation


class IncomingStack(object):
    def __init__(self, config, outgoing_local_layer):
        self.config = config

        self.local_layer = self.setup_local_layer(outgoing_local_layer)
        self.websocket_layer = self.setup_websocket_layer()
        self.rendezvous_layer = self.setup_rendezvous_layer(
            self.websocket_layer, self.local_layer)
        self.relay_layer = self.setup_relay_layer(self.rendezvous_layer)

    ###########################################################################

    def setup_relay_layer(self, rendezvous_layer):
        l = RelayLayer()
        l.register_above_layer(rendezvous_layer)
        l.register_layer_event(self.send_stack_event, "RELAY")
        l.set_rendezvous_layer(rendezvous_layer)
        return l

    def setup_rendezvous_layer(self, below_layer_1, below_layer_2):
        l = IncomingRendezvousLayer()
        l.register_above_layer(below_layer_1)
        l.register_above_layer(below_layer_2)
        l.register_layer_event(self.send_stack_event, "INCOMING_RENDEZVOUS")
        return l

    def setup_websocket_layer(self):
        l = IncomingWebsocketLayer()
        l.register_layer_event(self.send_stack_event, "INCOMING_WEBSOCKET")
        return l

    def setup_local_layer(self, outgoing_local_layer):
        l = IncomingLocalLayer()
        l.register_layer_event(self.send_stack_event, "INCOMING_LOCAL")
        outgoing_local_layer.set_incoming_layer(l)
        return l


    ###########################################################################

    def announce_nexus(self, relay_nexus):
        # TODO - register for messages and log errors if we get any not handled
        # by the stack?
        logging.debug("announced from below")

    def revoke_nexus(self, relay_nexus):
        logging.debug("revoked from below")

    def send_stack_event(self, layer_name, nexus, status):
        pass

    ###########################################################################

    def get_listen_locations(self):
        host = self.config['Listen']['ExternalHost']
        port = int(self.config['Listen']['ExternalPort'])
        use_tls = self.config['Listen']['UseTLS'] == "True"
        return [WebsocketLocation(host, port=port, use_tls=use_tls)]

    def get_listen_url(self):
        if self.config['Listen']['UseTLS'] == "True":
            url = "wss://%s:%s" % (
                self.config['Listen']['BindHost'],
                self.config['Listen']['BindPort'])
            return url
        elif self.config['Listen']['UseTLS'] == "False":
            url = "ws://%s:%s" % (
                self.config['Listen']['BindHost'],
                self.config['Listen']['BindPort'])
            return url
        else:
            logging.error("unknown setting: %s" %
                          self.config['Listen']['UseTLS'])
            return ''

    def get_tls_info(self):
        config_section = self.config['Listen']
        if config_section['UseTLS'] != "True":
            return None
        tls_info = {'sslmethod': SSL.TLSv1_2_METHOD,
                    'cert_file': os.path.abspath(config_section['CertFile']),
                    'key_file':  os.path.abspath(config_section['CertKey'])}
        tls_info['cert_chain_file'] = (
            os.path.abspath(config_section['CertChainFile']) if
            config_section['SelfSignedCert'] == "False" else None)
        return tls_info

    def listen(self):
        listen_url = self.get_listen_url()
        tls_info = self.get_tls_info()
        self.websocket_layer.listen(listen_url, tls_info=tls_info)
