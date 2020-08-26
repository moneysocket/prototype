#!/usr/bin/env python3
# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import uuid
import argparse
import logging

from twisted.internet import reactor


from moneysocket.beacon.beacon import MoneysocketBeacon
from moneysocket.beacon.location.websocket import WebsocketLocation

from moneysocket.protocol.provider.layer import ProviderLayer
from moneysocket.protocol.rendezvous.outgoing_layer import (
    OutgoingRendezvousLayer)
from moneysocket.protocol.websocket.outgoing_layer import OutgoingWebsocketLayer



#LOCATION = WebsocketLocation("localhost", port=11060, use_tls=False)


BEACON = "moneysocket1lcqqzqdm8nlqqqgph5gwjtqj6mehejav23gmvqswdfce3lsqqyquzg87qqqsr0cpq8lqqqgpcvfsqzf3xgmjuvpwxqhrzqgpqqpq8lftxs2uplj0"


class OutgoingTest():
    def __init__(self):
        self.beacon, _ = MoneysocketBeacon.from_bech32_str(BEACON)
        self.provider_layer = ProviderLayer(self, self)
        self.rendezvous_layer = OutgoingRendezvousLayer(self,
                                                        self.provider_layer)
        self.websocket_layer = OutgoingWebsocketLayer(self,
                                                      self.rendezvous_layer)
        self.provider_ss = None
        self.ready = False

    def announce_nexus_from_below_cb(self, nexus):
        logging.info("announced: %s" % nexus.uuid)
        nexus.register_upward_recv_cb(self.nexus_recv_cb)
        nexus.register_upward_recv_raw_cb(self.nexus_recv_raw_cb)


        logging.info("the app nexus:\n%s" % (nexus.downline_str()))
        pass

    def get_provider_info(self, shared_seed):
        self.provider_ss = shared_seed
        info = {'ready':         self.ready,
                'payer':         True,
                'payee':         True,
                'msats':         1234567,
                'provider_uuid': uuid.uuid4()}
        reactor.callLater(3.0, self.delayed_ready)
        return info

    def delayed_ready(self):
        self.ready = True
        self.provider_layer.provider_now_ready_from_app(self.provider_ss)

    def revoke_nexus_from_below_cb(self, nexus):
        logging.info("revoked: %s" % nexus.uuid)
        pass

    def nexus_recv_cb(self, nexus, msg):
        logging.info("recv: %s" % msg)
        pass

    def nexus_recv_raw_cb(self, nexus, msg_bytes):
        logging.info("raw_recv: %s %d" % (nexus.__class__.__name__,
                                          len(msg_bytes)))
        pass

    def run(self):
        logging.info("running")
        self.websocket_layer.connect(self.beacon.locations[0],
                                     self.beacon.shared_seed)
        pass


fmt = '%(asctime)s %(levelname)s: %(filename)s:%(lineno)d: %(message)s'
datefmt = '%H:%M:%S'
logging.basicConfig(format=fmt, datefmt=datefmt, level=logging.DEBUG)

ot = OutgoingTest()
ot.run()

reactor.run()
