# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import logging

from OpenSSL import SSL

from moneysocket.protocol.relay.layer import RelayLayer
from moneysocket.protocol.websocket.incoming_layer import IncomingWebsocketLayer
from moneysocket.protocol.rendezvous.incoming_layer import (
    IncomingRendezvousLayer)
from moneysocket.protocol.local.incoming_layer import IncomingLocalLayer
from moneysocket.beacon.location.websocket import WebsocketLocation


class TerminusRelay(object):
    def __init__(self, config, outgoing_local_layer):
        self.config = config
        self.outgoing_local_layer = outgoing_local_layer

        self.relay_layer = RelayLayer(self, self)
        self.incoming_rendezvous_layer = IncomingRendezvousLayer(
            self, self.relay_layer)
        self.incoming_websocket_layer = IncomingWebsocketLayer(
            self, self.incoming_rendezvous_layer)
        self.incoming_local_layer = IncomingLocalLayer(
            self, self.incoming_rendezvous_layer)

        self.relay_layer.set_rendezvous_layer(self.incoming_rendezvous_layer)

        self.outgoing_local_layer.set_incoming_layer(self.incoming_local_layer)

    ###########################################################################

    def announce_nexus_from_below_cb(self, relay_nexus):
        # TODO - register for messages and log errors if we get any not handled
        # by the stack?
        logging.debug("announced from below")

    def revoke_nexus_from_below_cb(self, relay_nexus):
        logging.debug("revoked from below")

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
        self.incoming_websocket_layer.listen(listen_url, tls_info=tls_info)
