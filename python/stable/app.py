# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.stack.outgoing_consumer import OutgoingConsumerStack

from moneysocket.beacon.beacon import MoneysocketBeacon

class StabledApp():
    def __init__(self):
        self.outgoing_consumer_stack = OutgoingConsumerStack(self)

    ###########################################################################

    def ls(self, parsed):
        print("app ls")
        return None

    def connectsource(self, parsed):
        print("app connect source")
        beacon, err = MoneysocketBeacon.from_bech32_str(parsed.beacon)
        if err:
            return err
        self.outgoing_consumer_stack.do_connect(beacon)
        return None

    def disconnectsource(self, parsed):
        print("app disconnect source")
        return None

    def rm(self, parsed):
        print("app parsed")
        return None

    ###########################################################################


    def consumer_online_cb(self):
        print("consumer online")
        pass

    def consumer_offline_cb(self):
        print("consumer offline")
        pass

    def consumer_report_provider_info_cb(self, provider_info):
        pass

    def consumer_report_ping_cb(self, msecs):
        pass

    def consumer_post_stack_event_cb(self, layer_name, status):
        print("layer: %s  status: %s" % (layer_name, status))
        pass

    def consumer_report_bolt11_cb(self, bolt11, request_reference_uuid):
        pass

    def consumer_report_preimage_cb(self, preimage, request_reference_uuid):
        pass
