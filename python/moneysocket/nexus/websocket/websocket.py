# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging

from moneysocket.nexus.nexus import Nexus


class WebsocketNexus(Nexus):
    def __init__(self, below_nexus, layer):
        super().__init__(below_nexus, layer)

    def on_message(self, below_nexus, msg):
        logging.info("websocket nexus got msg")
        super().on_message(below_nexus, msg)

    def on_bin_message(self, below_nexus, msg_bytes):
        logging.info("websocket nexus got raw msg")
        super().on_bin_message(below_nexus, msg_bytes)
