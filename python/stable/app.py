# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import random
import uuid
import logging

from moneysocket.stack.consumer import OutgoingConsumerStack
from moneysocket.stack.bidirectional_provider import (
    BidirectionalProviderStack)
from moneysocket.beacon.beacon import MoneysocketBeacon
from moneysocket.beacon.shared_seed import SharedSeed

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
        # TODO transact layer to de-dupe nexuses with the same provider
        assert nexus_uuid not in self.assets
        self.assets[nexus_uuid] = provider_info

    def forget_asset(self, nexus_uuid):
        popped = self.assets.pop(nexus_uuid, None)
        # TODO - cli command
        return popped is not None

    def select_paying_nexus_uuid(self, msats):
        for nexus_uuid, asset in self.assets.items():
            if msats < provider_info['msats']:
                return nexus_uuid
        return None

    def select_receiving_nexus_uuid(self):
        choices = [nexus_uuid for nexus_uuid, provider_info in
                   self.assets.items() if provider_info['payee']]
        if len(choices) == 0:
            return None
        return random.choice(choices)


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

        self.invoice_requests = {}
        self.pay_requests = {}

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
        locations = self.provider_stack.get_listen_locations()
        print("app getinfo")
        s = str(self.accounting) + "\nAccounts:\n"
        for a in Account.iter_persisted_accounts():
            s += a.summary_string(locations) + "\n"
        return s

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
        name = parsed.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        beacon_str = parsed.beacon

        beacon, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        if err:
            return "*** could not decode beacon: %s" % err
        location = beacon.locations[0]
        if location.to_dict()['type'] != "WebSocket":
            return "*** can't connect to beacon location"

        shared_seed = beacon.shared_seed
        connection_attempt = self.provider_stack.connect(location, shared_seed)
        account.add_connection_attempt(beacon, connection_attempt)
        account.add_beacon(beacon)
        self.directory.reindex_account(account)
        return "connected: %s to %s" % (name, str(location))


    def listen(self, parsed):
        name = parsed.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        shared_seed_str = parsed.shared_seed
        if shared_seed_str:
            shared_seed = SharedSeed.from_hex_str(shared_seed_str)
            if not shared_seed:
                return ("*** could not understand shared seed: %s" %
                        parsed.shared_seed)
            beacon = MoneysocketBeacon(shared_seed)
        else:
            # generate a shared_seed
            beacon = MoneysocketBeacon()
            shared_seed = beacon.shared_seed

        # generate new beacon
        # location is the provider_stack's incoming websocket
        beacon.locations = self.provider_stack.get_listen_locations()
        account.add_shared_seed(shared_seed)
        # register shared seed with local listener
        self.local_connect(shared_seed)
        self.directory.reindex_account(account)
        return "listening: %s to %s" % (name, beacon)


    def clear(self, parsed):
        name = parsed.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        # TODO - cli for more precice removal of connection?

        # outgoing websocket layer -> find all that have this shared seed
        # initiate close to disconnect
        for beacon in account.get_beacons():
            shared_seed = beacon.get_shared_seed()
            self.provider_stack.disconnect(shared_seed)
            account.remove_beacon(beacon)

        # deregister from local layer
        for shared_seed in account.get_shared_seeds():
            self.provider_stack.local_disconnect(shared_seed)
            account.remove_shared_seed(shared_seed)
        self.directory.reindex_account(account)
        return "cleared connections for %s" % (parsed.account)


    def rm(self, parsed):
        name = parsed.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        if len(account.get_all_shared_seeds()) > 0:
            return "*** still has connections: %s" % name

        self.directory.remove_account(account)
        account.depersist()
        return "removed: %s" % name

    ###########################################################################
    # consumer stack callbacks
    ###########################################################################


    def consumer_online_cb(self, nexus):
        print("consumer online")

    def consumer_offline_cb(self, nexus):
        print("consumer offline")

    def consumer_report_provider_info_cb(self, nexus, provider_info):
        print("provider info: %s" % provider_info)
        self.accounting.add_asset(nexus.uuid, provider_info)

    def consumer_report_ping_cb(self, nexus, msecs):
        print("got ping: %s" % msecs)
        pass

    def consumer_post_stack_event_cb(self, layer_name, nexus, status):
        print("consumer layer: %s  status: %s" % (layer_name, status))
        pass

    def consumer_report_bolt11_cb(self, nexus, bolt11, request_reference_uuid):
        if request_reference_uuid not in self.invoice_requests:
            logging.error("got bolt11 not requested? %s" %
                          request_reference_uuid)
            return

        request_info = self.invoice_requests.pop(request_reference_uuid)
        provider_nexus_uuid = request_info['provider_nexus_uuid']
        provider_request_uuid = request_info['provider_request_uuid']
        self.provider_stack.fulfil_request_invoice_cb(
            provider_nexus_uuid, bolt11, provider_request_uuid)


    def consumer_report_preimage_cb(self, nexus, preimage,
                                    request_reference_uuid):
        pass

    ###########################################################################
    # provider stack callbacks
    ###########################################################################

    def provider_online_cb(self, nexus):
        print("provider online")

    def provider_offline_cb(self, nexus):
        print("provider offline")

    def provider_post_stack_event_cb(self, layer_name, nexus, status):
        print("provider layer: %s  status: %s" % (layer_name, status))

    def get_provider_info(self, shared_seed):
        print("app - get provider info: %s" % shared_seed)
        account = self.directory.lookup_by_seed(shared_seed)
        if not account:
            # TODO - error instead?
            return {'ready': False}
        return account.get_provider_info()

    def provider_requesting_invoice_cb(self, nexus, msats, request_uuid):
        nexus_uuid = self.accounting.select_receiving_nexus_uuid()
        if not nexus_uuid:
            return "no account capable of receiving"
        print("receiving: %s" % nexus_uuid)
        our_request_uuid, err = self.consumer_stack.request_invoice(nexus_uuid,
                                                                    msats, "")
        if err:
            return err
        self.invoice_requests[our_request_uuid] = {
            'provider_nexus_uuid':   nexus.uuid,
            'provider_request_uuid': request_uuid}
        return None



    def provider_requesting_pay_cb(self, shared_seed, bolt11, request_uuid):
        pass

    ###########################################################################
    # run
    ###########################################################################

    def load_persisted(self):
        for account in Account.iter_persisted_accounts():
            self.directory.add_account(account)
            for beacon in account.get_beacons():
                location = beacon.locations[0]
                assert location.to_dict()['type'] == "WebSocket"
                shared_seed = beacon.shared_seed
                connection_attempt = self.provider_stack.connect(location,
                                                                 shared_seed)
                account.add_connection_attempt(beacon, connection_attempt)
            for shared_seed in account.get_shared_seeds():
                self.provider_stack.local_connect(shared_seed)

    def run(self):
        self.load_persisted()
        self.provider_stack.listen()
