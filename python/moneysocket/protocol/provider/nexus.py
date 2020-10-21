# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

from moneysocket.protocol.nexus import ProtocolNexus
from moneysocket.message.notification.provider import NotifyProvider
from moneysocket.message.notification.pong import NotifyPong
from moneysocket.message.notification.provider_not_ready import (
    NotifyProviderNotReady)

class ProviderNexus(ProtocolNexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)
        self.provider_finished_cb = None
        self.request_reference_uuid = None

    ###########################################################################

    def is_layer_message(self, msg):
        if msg['message_class'] != "REQUEST":
            return False
        return msg['request_name'] in {"REQUEST_PROVIDER", "REQUEST_PING"}

    def recv_from_below_cb(self, below_nexus, msg):
        logging.info("provider nexus got msg")

        if not self.is_layer_message(msg):
            super().recv_from_below_cb(below_nexus, msg)
            return

        self.request_reference_uuid = msg['request_uuid']
        if msg['request_name'] == "REQUEST_PROVIDER":
            shared_seed = below_nexus.get_shared_seed()
            provider_info = self.layer.stack.get_provider_info(shared_seed)
            if provider_info['ready']:
                self.notify_provider_ready()
            else:
                self.notify_provider_not_ready()
                self.layer.nexus_waiting_for_app(shared_seed, self)
        else:
            assert msg['request_name'] == "REQUEST_PING"
            self.notify_pong()

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        logging.info("provider nexus got raw msg")
        super().recv_raw_from_below_cb(below_nexus, msg_bytes)

    ###########################################################################

    def notify_pong(self):
        self.send(NotifyPong(self.request_reference_uuid))

    def notify_provider_not_ready(self):
        self.send(NotifyProviderNotReady(self.request_reference_uuid))

    def notify_provider_ready(self):
        shared_seed = self.below_nexus.get_shared_seed()
        provider_info = self.layer.stack.get_provider_info(shared_seed)
        assert provider_info['ready']
        provider_uuid = provider_info['provider_uuid']
        payer = provider_info['payer']
        payee = provider_info['payee']
        msats = provider_info['msats']
        self.send(NotifyProvider(provider_uuid,
                    request_reference_uuid=self.request_reference_uuid,
                    payer=payer, payee=payee, msats=msats))
        self.provider_finished_cb(self)

    ###########################################################################

    def provider_now_ready(self):
        self.notify_provider_ready()

    def wait_for_consumer(self, provider_finished_cb):
        self.provider_finished_cb = provider_finished_cb
