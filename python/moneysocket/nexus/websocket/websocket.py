# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

from moneysocket.nexus.nexus import Nexus


class WebsocketNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)

    def recv_from_below_cb(self, below_nexus, msg):
        logging.info("websocket nexus got msg")
        super().recv_from_below_cb(below_nexus, msg)

    def recv_raw_from_below_cb(self, below_nexus, msg_bytes):
        logging.info("websocket nexus got raw msg")
        super().recv_raw_from_below_cb(below_nexus, msg_bytes)
