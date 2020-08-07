# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.core.message.request.request import MoneysocketRequest

class RequestPing(MoneysocketRequest):
    def __init__(self):
        super().__init__("REQUEST_PING")

    @staticmethod
    def cast_class(msg_dict):
        c = RequestPing()
        c.update(msg_dict)
        return c

    @staticmethod
    def check_valid_msg_dict(msg_dict):
        return None


MoneysocketRequest.REQUEST_SUBCLASSES['REQUEST_PING'] = RequestPing
