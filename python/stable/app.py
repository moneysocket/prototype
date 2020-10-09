# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.stack.consumer import OutgoingConsumerStack
from moneysocket.stack.bidirectional_provider import (
    BidirectionalProviderStack)
from moneysocket.beacon.beacon import MoneysocketBeacon

from stable.account import Account
from stable.account_db import AccountDb
from stable.directory import StableDirectory


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
    def __init__(self, config):
        self.config = config
        self.consumer_stack = OutgoingConsumerStack(self)
        self.provider_stack = BidirectionalProviderStack(config, self)
        self.accounting = StabledAccounting()
        self.assets = {}


        AccountDb.PERSIST_DIR = self.config['App']['AccountPersistDir']
        self.directory = StableDirectory()

    ###########################################################################

    def gen_account_name(self):
        i = 0
        def account_name(n):
            return "account-%d" % n
        while self.directory.lookup_by_name(account_name(i)) is not None:
            i += 1
        return account_name(i)

    def arg_to_msats(self, msat_string):
        if msat_string.endswith("msat"):
            try:
                msats = int(msat_string[:-4])
            except:
                return None, "*** could not parse msat value"
        elif msat_string.endswith("msats"):
            try:
                msats = int(msat_string[:-5])
            except:
                return None, "*** could not parse msat value"
        elif msat_string.endswith("sat"):
            try:
                msats = 1000 * int(msat_string[:-3])
            except:
                return None, "*** could not parse msat value"
        elif msat_string.endswith("sats"):
            try:
                msats = 1000 * int(msat_string[:-4])
            except:
                return None, "*** could not parse msat value"
        else:
            try:
                msats = 1000 * int(msat_string)
            except:
                return None, "*** could not parse msat value"
        if msats <= 0:
            return None, "*** invalid msatoshis value"
        return msats, None

    ###########################################################################
    # stable-cli commands
    ###########################################################################

    def getinfo(self, parsed):
        print("app getinfo")
        return str(self.accounting)

    def connectasset(self, parsed):
        print("app connect asset")
        beacon, err = MoneysocketBeacon.from_bech32_str(parsed.beacon)
        if err:
            return err
        self.consumer_stack.do_connect(beacon)
        return None

    def disconnectasset(self, parsed):
        print("app disconnect asset")
        return None

    def createstable(self, parsed):
        return None

    def create(self, parsed):
        name = self.gen_account_name()
        print("generated: %s" % name)

        msats, err = self.arg_to_msats(parsed.msatoshis)
        if err:
            return err
        name = self.gen_account_name()
        account = Account(name)
        account.set_msatoshis(msats)
        self.directory.add_account(account)
        return "created account: %s  msatoshis: %d" % (name, msats)


    def connect(self, parsed):
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
        if nexus.uuid in self.assets:
            del self.assets[nexus.uuid]
        self.accounting.revoke_asset(nexus.uuid)

    def consumer_report_provider_info_cb(self, nexus, provider_info):
        print("provider info: %s" % provider_info)
        self.assets[nexus.uuid] = {'nexus':         nexus,
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

    ###########################################################################
    # run
    ###########################################################################

    def run(self):
        self.provider_stack.listen()
