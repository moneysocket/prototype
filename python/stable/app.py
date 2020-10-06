# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.stack.consumer import OutgoingConsumerStack

from moneysocket.beacon.beacon import MoneysocketBeacon


class StabledAccounting():
    def __init__(self):
        self.assets = {}
        self.liabilities = {}

    def iter_lines(self):
        yield "Assets:"
        for info in self.assets.values():
            yield "\tuuid: %s" % info['provider_uuid']
            yield "\t\tmsats: %d   payer: %s   payee: %s" % (info['msats'],
                                                             info['payee'],
                                                             info['payer'])
        yield "Liabilities:"
        for info in self.liabilities.values():
            yield "\ttodo"

    def __str__(self):
        return "\n".join(self.iter_lines())

    def add_asset(self, nexus_uuid, provider_info):
        self.assets[nexus_uuid] = provider_info

    def revoke_asset(self, nexus_uuid):
        if nexus_uuid in self.assets:
            del self.assets[nexus_uuid]


    def add_liability(self, provider_info):
        pass

    def revoke_liability(self, provider_info):
        pass


class StabledApp():
    def __init__(self):
        self.outgoing_consumer_stack = OutgoingConsumerStack(self)
        self.accounting = StabledAccounting()
        self.sources = {}

    ###########################################################################
    # stable-cli commands
    ###########################################################################

    def getinfo(self, parsed):
        print("app getinfo")
        return str(self.accounting)

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
    # consumer stack callbacks
    ###########################################################################


    def consumer_online_cb(self, nexus):
        print("consumer online")

    def consumer_offline_cb(self, nexus):
        print("consumer offline")
        if nexus.uuid in self.sources:
            del self.sources[nexus.uuid]
        self.accounting.revoke_asset(nexus.uuid)

    def consumer_report_provider_info_cb(self, nexus, provider_info):
        print("provider info: %s" % provider_info)
        self.sources[nexus.uuid] = {'nexus':         nexus,
                                    'provider_info': provider_info}
        self.accounting.add_asset(nexus.uuid, provider_info)

    def consumer_report_ping_cb(self, nexus, msecs):
        print("got ping: %s" % msecs)
        pass

    def consumer_post_stack_event_cb(self, layer_name, nexus, status):
        print("layer: %s  status: %s" % (layer_name, status))
        pass

    def consumer_report_bolt11_cb(self, nexus, bolt11, request_reference_uuid):
        pass

    def consumer_report_preimage_cb(self, nexus, preimage,
                                    request_reference_uuid):
        pass
