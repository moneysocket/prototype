# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import time
import logging

from twisted.internet.task import LoopingCall

from moneysocket.nexus.nexus import Nexus

from moneysocket.message.request.provider import RequestProvider
from moneysocket.message.request.ping import RequestPing


class ConsumerNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        assert "notify_ping_cb" in dir(layer)
        self.consumer_finished_cb = None;
        self.handshake_finished = False;
        self.ping_interval = None;
        self.ping_start_time = None;


    ###########################################################################

    def is_layer_message(self, msg):
        if msg['message_class'] != "NOTIFICATION":
            return False
        return msg['notification_name'] in {"NOTIFY_PROVIDER",
                                            "NOTIFY_PROVIDER_NOT_READY",
                                            "NOTIFY_PING"}

    def recv_from_below_cb(self, below_nexus, msg):
        logging.info("consumer nexus got msg")

        if not self.is_layer_message(msg):
            super().recv_from_below_cb(below_nexus, msg)
            return

        if msg['notification_name'] == "NOTIFY_PROVIDER":
            if not self.handshake_finished:
                self.handshake_finished = True
                # nexus is announced to the transact layer
                # TODO, this message might be better to handle in the transact
                # layer instead. Refactor might be needed.
                self.consumer_finished_cb(self)
            # pass the message above for the transact layer to process
            super().recv_from_below_cb(below_nexus, msg)
        elif msg['notification_name'] == "NOTIFY_PROVIDER_NOT_READY":
            logging.info("provider not ready, waiting")
        elif msg['notification_name'] == "NOTIFY_PONG":
            if not self.ping_start_time:
                return
            msecs = (time.time() - self.ping_start_time) * 1000;
            self.layer.notify_ping_cb(self, round(msecs))
            self.ping_start_time = None;

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        logging.info("provider nexus got raw msg")
        super().recv_raw_from_below_cb(below_nexus, msg_bytes)

    ###########################################################################


    def start_handshake(self, consumer_finished_cb):
        self.consumer_finished_cb = consumer_finished_cb;
        self.send(RequestProvider());

    def send_ping(self):
        self.ping_start_time = time.time()
        self.send(RequestPing());


    def start_pinging(self):
        logging.info("START PING");
        self.ping_interval = LoopingCall(self.send_ping)
        self.ping_interval.start(3.0, now=True)

    def stop_pinging(self):
        logging.info("STOP PING");
        if not self.ping_interval:
            return
        self.ping_interval.stop()
        self.ping_interval = None;
