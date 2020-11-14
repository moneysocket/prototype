# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import random
import uuid
import logging


from twisted.internet.task import LoopingCall

from moneysocket.utl.bolt11 import Bolt11
from moneysocket.stack.consumer import OutgoingConsumerStack
from moneysocket.stack.bidirectional_provider import (
    BidirectionalProviderStack)
from moneysocket.beacon.beacon import MoneysocketBeacon
from moneysocket.beacon.shared_seed import SharedSeed
from moneysocket.wad.wad import Wad
from moneysocket.wad.rate import Rate

from stable.account import Account
from stable.account_db import AccountDb
from stable.directory import StableDirectory
from stable.connect_db import ConnectDb
from stable.rate_db import RateDb
from stable.rate_update import RateUpdate


class StabledAssetPool():
    def __init__(self):
        self.assets = {}
        self.connection_attempts = {}

    def iter_lines(self):
        yield "Connections:"
        for beacon, ca in self.connection_attempts.items():
            yield "\toutgoing beacon: %s" % beacon
            yield "\t\tconnection attempt: %s" % str(ca)
        yield "Assets:"
        for info in self.assets.values():
            yield "\tuuid: %s" % info['account_uuid']
            yield "\t\twad: %s   payer: %s   payee: %s" % (
                info['wad'].fmt_short(), info['payee'], info['payer'])

    def __str__(self):
        return "\n".join(self.iter_lines())

    ###########################################################################

    def add_asset(self, nexus_uuid, provider_info):
        # TODO transact layer to de-dupe nexuses with the same provider
        self.assets[nexus_uuid] = provider_info

    def forget_asset(self, nexus_uuid):
        popped = self.assets.pop(nexus_uuid, None)
        # TODO - cli command
        return popped is not None

    ###########################################################################

    def add_connection_attempt(self, beacon, connection_attempt):
        beacon_str = beacon.to_bech32_str()
        self.connection_attempts[beacon_str] = connection_attempt

    def remove_connection_attempt(self, beacon):
        beacon_str = beacon.to_bech32_str()
        del self.connection_attempts[beacon_str]


    def get_disconnected_beacons(self):
        dbs = []
        for beacon_str, connection_attempt in self.connection_attempts.items():
            if connection_attempt.get_state() == "disconnected":
                dbs.append(MoneysocketBeacon.from_bech32_str(beacon_str)[0])
        return dbs

    ###########################################################################

    def select_paying_nexus_uuid(self, msats):
        for nexus_uuid, provider_info in self.assets.items():
            if msats < provider_info['wad']['msats']:
                return nexus_uuid
        return None

    def select_receiving_nexus_uuid(self):
        choices = [nexus_uuid for nexus_uuid, provider_info in
                   self.assets.items() if provider_info['payee']]
        if len(choices) == 0:
            return None
        return random.choice(choices)


class StabledApp():
    def __init__(self, config, config_dir):
        self.config = config
        self.connect_db = ConnectDb(config_dir)
        self.rate_db = RateDb(config_dir)
        self.rate_update = RateUpdate(self, self.rate_db)
        self.consumer_stack = self.setup_consumer_stack()
        self.provider_stack = self.setup_provider_stack()
        self.asset_pool = StabledAssetPool()

        AccountDb.PERSIST_DIR = self.config['App']['AccountPersistDir']
        self.liabilities = StableDirectory()

        self.invoice_requests = {}
        self.pay_requests = {}

        self.connect_loop = None
        self.prune_loop = None

    ###########################################################################

    def setup_consumer_stack(self):
        s = OutgoingConsumerStack()
        s.onannounce = self.consumer_on_announce
        s.onrevoke = self.consumer_on_revoke
        s.onstackevent = self.consumer_on_stack_event
        s.onproviderinfo = self.consumer_on_provider_info
        s.onping = self.consumer_on_ping
        s.oninvoice = self.consumer_on_invoice
        s.onpreimage = self.consumer_on_preimage
        return s

    def setup_provider_stack(self):
        s = BidirectionalProviderStack(self.config)
        s.onannounce = self.provider_on_announce
        s.onrevoke = self.provider_on_revoke
        s.onstackevent = self.provider_on_stack_event
        s.handleproviderinforequest = self.provider_handle_provider_info_request
        s.handleinvoicerequest = self.provider_handle_invoice_request
        s.handlepayrequest = self.provider_handle_pay_request
        return s

    ###########################################################################

    def gen_account_name(self):
        i = 0
        def account_name(n):
            return "account-%d" % n
        while self.liabilities.lookup_by_name(account_name(i)) is not None:
            i += 1
        return account_name(i)

    ###########################################################################
    # stable-cli commands
    ###########################################################################

    def getinfo(self, parsed):
        locations = self.provider_stack.get_listen_locations()
        print("app getinfo")
        s = str(self.rate_db) + "\n" + str(self.asset_pool) + "\nAccounts:\n"
        for a in self.liabilities.iter_accounts():
            s += a.summary_string(locations) + "\n"
        return s

    def connectasset(self, parsed):
        print("app connect asset")
        beacon, err = MoneysocketBeacon.from_bech32_str(parsed.beacon)
        if err:
            return err

        self.connect_db.add_beacon(beacon)
        connection_attempt = self.consumer_stack.do_connect(beacon)
        self.asset_pool.add_connection_attempt(beacon, connection_attempt)
        return "connected"

    def disconnectasset(self, parsed):
        print("app disconnect asset")
        beacon, err = MoneysocketBeacon.from_bech32_str(parsed.beacon)
        if err:
            return err
        if not self.connect_db.has_beacon(beacon):
            return "beacon not known"
        self.connect_db.remove_beacon(beacon)
        self.asset_pool.remove_connection_attempt(beacon)
        # TODO - don't disconnect everything
        self.consumer_stack.do_disconnect()
        return "disconnected"

    def createstable(self, parsed):
        name = self.gen_account_name()
        print("generated: %s" % name)

        code = parsed.asset
        if not self.rate_db.has_rate("BTC", code):
            return "*** don't have an exchange rate for %s" % code
        rate = self.rate_db.get_rate("BTC", code)
        if self.rate_db.has_symbol(code):
            symbol = self.rate_db.get_symbol(code)
        else:
            symbol = ""
        wad = Wad.custom(float(parsed.amount), rate, code, None, 2, code,
                         symbol)
        account = Account(name)
        account.set_wad(wad)
        self.liabilities.add_account(account)
        return "created account: %s  wad: %s" % (name, wad)

    def create(self, parsed):
        name = self.gen_account_name()
        print("generated: %s" % name)

        wad, err = Wad.bitcoin_from_msat_string(parsed.msatoshis)
        if err:
            return err

        account = Account(name)
        account.set_wad(wad)
        self.liabilities.add_account(account)
        return "created account: %s  wad: %s" % (name, wad)

    def connect(self, parsed):
        name = parsed.account
        account = self.liabilities.lookup_by_name(name)
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
        self.liabilities.reindex_account(account)
        return "connected: %s to %s" % (name, str(location))


    def listen(self, parsed):
        name = parsed.account
        account = self.liabilities.lookup_by_name(name)
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
        self.liabilities.reindex_account(account)
        return "listening: %s to %s" % (name, beacon)


    def clear(self, parsed):
        name = parsed.account
        account = self.liabilities.lookup_by_name(name)
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
        self.liabilities.reindex_account(account)
        return "cleared connections for %s" % (parsed.account)


    def rm(self, parsed):
        name = parsed.account
        account = self.liabilities.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        if len(account.get_all_shared_seeds()) > 0:
            return "*** still has connections: %s" % name

        self.liabilities.remove_account(account)
        account.depersist()
        return "removed: %s" % name

    def createpegged(self, parsed):
        print("symbol: %s" % parsed.symbol)
        print("code: %s" % parsed.code)
        print("peg_amount: %s" % parsed.peg_amount)
        print("pegged_to_code: %s" % parsed.pegged_to_code)
        symbol = parsed.symbol
        code = parsed.code
        peg_amount = float(parsed.peg_amount)
        pegged_to_code = parsed.pegged_to_code
        if not self.rate_db.has_rate("BTC", pegged_to_code):
            return "*** do not have BTC rate for %s" % pegged_to_code

        if self.rate_db.has_pegged(code):
            return "*** already tracking code %s" % code

        peg_rate = Rate(code, pegged_to_code, float(peg_amount))
        print("peg_rate: %s" % peg_rate)
        self.rate_db.add_symbol(code, symbol)
        self.rate_db.add_pegged(peg_rate)
        return None

    def rmpegged(self, parsed):
        print("code: %s" % parsed.code)
        if not self.rate_db.has_pegged(parsed.code):
            return "*** not pegged: %s" % parsed.code
        err = self.rate_db.rm_pegged(parsed.code, parsed.pegged_to_code)
        return err


    ###########################################################################
    # consumer stack callbacks
    ###########################################################################


    def consumer_on_announce(self, nexus):
        print("consumer online")

    def consumer_on_revoke(self, nexus):
        print("consumer offline")
        self.asset_pool.forget_asset(nexus.uuid)

    def consumer_on_provider_info(self, nexus, provider_info):
        print("provider info: %s" % provider_info)
        self.asset_pool.add_asset(nexus.uuid, provider_info)

    def consumer_on_ping(self, nexus, msecs):
        print("got ping: %s" % msecs)
        pass

    def consumer_on_stack_event(self, layer_name, nexus, status):
        print("consumer layer: %s  status: %s" % (layer_name, status))
        pass

    def consumer_on_invoice(self, nexus, bolt11, request_reference_uuid):
        if request_reference_uuid not in self.invoice_requests:
            logging.error("got bolt11 not requested? %s" %
                          request_reference_uuid)
            return

        request_info = self.invoice_requests.pop(request_reference_uuid)


        liability_nexus_uuid = request_info['liability_nexus_uuid']
        liability_request_uuid = request_info['liability_request_uuid']
        liability_account_uuid = request_info['liability_account_uuid']
        asset_nexus_uuid = request_info['asset_nexus_uuid']
        msats_requested = request_info['msats_requested']

        liability_account = self.liabilities.lookup_by_uuid(
            liability_account_uuid)

        if asset_nexus_uuid != nexus.uuid:
            logging.info("got bolt11 from different nexus than requested?")

        if not liability_account:
            logging.error("liability account removed?")
            return

        bolt11_msats = Bolt11.get_msats(bolt11)
        if bolt11_msats and bolt11_msats != msats_requested:
            logging.error("got wrong msats amount?")
            return

        bolt11_payment_hash = Bolt11.get_payment_hash(bolt11)
        liability_account.add_pending(bolt11_payment_hash, bolt11)
        self.liabilities.reindex_account(liability_account)

        # notify requesting provider of this bolt11
        self.provider_stack.fulfil_request_invoice_cb(
            liability_nexus_uuid, bolt11, liability_request_uuid)
        # TODO handle provider nexus gone?


    def _handle_pending_preimage(self, nexus, preimage, request_reference_uuid):
        payment_hash = Bolt11.preimage_to_payment_hash(preimage)
        logging.info("preimage %s payment_hash %s" % (preimage, payment_hash))

        liability_accounts = list(
            self.liabilities.lookup_by_pending_payment_hash(payment_hash))
        assert len(liability_accounts) <= 1, "can't handle collision yet"
        if len(liability_accounts) == 0:
            logging.error("got preimage not associated to liability?")
            return
        liability_account = liability_accounts[0]

        shared_seeds = liability_account.get_all_shared_seeds()

        msats_recvd = [Bolt11.get_msats(bolt11) for ph, bolt11 in
                       liability_account.iter_pending() if
                       ph == payment_hash][0]
        liability_account.remove_pending(payment_hash)
        liability_account.add_wad(Wad.bitcoin(msats_recvd))
        self.liabilities.reindex_account(liability_account)
        self.provider_stack.notify_preimage(shared_seeds, preimage, None)


    def _handle_paying_preimage(self, nexus, preimage, request_reference_uuid):
        payment_hash = Bolt11.preimage_to_payment_hash(preimage)
        logging.info("preimage %s payment_hash %s" % (preimage, payment_hash))

        liability_accounts = list(
            self.liabilities.lookup_by_paying_payment_hash(payment_hash))
        assert len(liability_accounts) <= 1, "can't handle collision yet"
        if len(liability_accounts) == 0:
            logging.error("got preimage not associated to liability?")
            return
        liability_account = liability_accounts[0]

        shared_seeds = liability_account.get_all_shared_seeds()

        msats_sent = [Bolt11.get_msats(bolt11) for ph, bolt11 in
                      liability_account.iter_paying() if
                      ph == payment_hash][0]
        liability_account.remove_paying(payment_hash)
        liability_account.subtract_wad(Wad.bitcoin(msats_sent))
        self.liabilities.reindex_account(liability_account)

        if request_reference_uuid in self.pay_requests:
            info = self.pay_requests.pop(request_reference_uuid)
            rrid = info['liability_request_uuid']
        else:
            rrid = None

        self.provider_stack.notify_preimage(shared_seeds, preimage, rrid)


    def consumer_on_preimage(self, nexus, preimage, request_reference_uuid):
        self._handle_pending_preimage(nexus, preimage, request_reference_uuid)
        self._handle_paying_preimage(nexus, preimage, request_reference_uuid)


    ###########################################################################
    # provider stack callbacks
    ###########################################################################

    def provider_on_announce(self, nexus):
        print("provider online")

    def provider_on_revoke(self, nexus):
        print("provider offline")

    def provider_on_stack_event(self, layer_name, nexus, status):
        print("provider layer: %s  status: %s" % (layer_name, status))

    def provider_handle_provider_info_request(self, shared_seed):
        print("app - get provider info: %s" % shared_seed)
        account = self.liabilities.lookup_by_seed(shared_seed)
        if not account:
            # TODO - error instead?
            return {'ready': False}
        return account.get_provider_info()

    def provider_handle_invoice_request(self, nexus, msats, request_uuid):

        # determine liability account
        shared_seed = nexus.get_shared_seed()
        liability_account = self.liabilities.lookup_by_seed(shared_seed)
        if not liability_account:
            return "unknown account"

        asset_nexus_uuid = self.asset_pool.select_receiving_nexus_uuid()
        if not asset_nexus_uuid:
            return "no stabled backend connection capable of receiving"
        our_request_uuid, err = self.consumer_stack.request_invoice(
            asset_nexus_uuid, msats, "")
        if err:
            return err
        self.invoice_requests[our_request_uuid] = {
            'liability_nexus_uuid':   nexus.uuid,
            'liability_request_uuid': request_uuid,
            'liability_account_uuid': liability_account.uuid,
            'asset_nexus_uuid':       asset_nexus_uuid,
            'msats_requested':        msats,
            }
        return None

    def provider_handle_pay_request(self, nexus, bolt11, request_uuid):
        msats = Bolt11.get_msats(bolt11)
        if not msats:
            return "no amount specified in bolt11"
        payment_hash = Bolt11.get_payment_hash(bolt11)
        shared_seed = nexus.get_shared_seed()
        liability_account = self.liabilities.lookup_by_seed(shared_seed)
        spendable_msats = (liability_account.get_msatoshis() -
                           liability_account.get_pending_msatoshis())
        if msats > spendable_msats:
            return  "insufficent balance to pay"

        # decide which of our asset accounts will pay the bolt11
        asset_nexus_uuid = self.asset_pool.select_paying_nexus_uuid(msats)
        if not asset_nexus_uuid:
            return "no account capable of receiving"

        liability_account.add_paying(payment_hash, bolt11)
        self.liabilities.reindex_account(liability_account)

        our_request_uuid = self.consumer_stack.request_pay(asset_nexus_uuid,
                                                           bolt11)
        self.pay_requests[our_request_uuid] = {
            'liability_nexus_uuid':   nexus.uuid,
            'liability_request_uuid': request_uuid,
            'liability_account_uuid': liability_account.uuid,
            'bolt11':                 bolt11,
            'asset_nexus_uuid':       asset_nexus_uuid}

    ###########################################################################
    # rate callback
    ###########################################################################

    def rate_change_cb(self, new_rate, code):
        print("changed: %s" % code)

        accounts = self.liabilities.lookup_by_currency_code(code)
        for account in accounts:
            wad = account.get_wad()
            wad.adjust_msats_to_rate(new_rate)
            account.set_wad(wad)
            shared_seeds = account.get_all_shared_seeds()
            self.provider_stack.notify_provider_info(shared_seeds)

        self.rate_db.recalc_pegged()
        pegged_codes = self.rate_db.get_pegs_of(code)
        #print(pegged_codes)
        for pegged_code in pegged_codes:
            accounts = self.liabilities.lookup_by_currency_code(pegged_code)
            #print(accounts)
            new_rate = self.rate_db.get_rate("BTC", pegged_code)
            for account in accounts:
                wad = account.get_wad()
                wad.adjust_msats_to_rate(new_rate)
                account.set_wad(wad)
                shared_seeds = account.get_all_shared_seeds()
                self.provider_stack.notify_provider_info(shared_seeds)


    ###########################################################################
    # lifecycle stuff
    ###########################################################################

    def load_persisted(self):
        for account in Account.iter_persisted_accounts():
            self.liabilities.add_account(account)
            for beacon in account.get_beacons():
                location = beacon.locations[0]
                assert location.to_dict()['type'] == "WebSocket"
                shared_seed = beacon.shared_seed
                connection_attempt = self.provider_stack.connect(location,
                                                                 shared_seed)
                account.add_connection_attempt(beacon, connection_attempt)
            for shared_seed in account.get_shared_seeds():
                self.provider_stack.local_connect(shared_seed)

        for beacon in self.connect_db.get_asset_beacons():
            connection_attempt = self.consumer_stack.do_connect(beacon)
            self.asset_pool.add_connection_attempt(beacon, connection_attempt)


    ###########################################################################

    def retry_connections(self):
        for account in self.liabilities.iter_accounts():
            disconnected_beacons = account.get_disconnected_beacons()
            for beacon in disconnected_beacons:
                #logging.error("disconnected: %s" % beacon.to_bech32_str())
                location = beacon.locations[0]
                assert location.to_dict()['type'] == "WebSocket"
                shared_seed = beacon.shared_seed
                connection_attempt = self.provider_stack.connect(location,
                                                                 shared_seed)
                account.add_connection_attempt(beacon, connection_attempt)

        for beacon in self.asset_pool.get_disconnected_beacons():
            connection_attempt = self.consumer_stack.do_connect(beacon)
            self.asset_pool.add_connection_attempt(beacon, connection_attempt)

    def prune_expired_pending(self):
        for account in self.liabilities.iter_accounts():
            account.prune_expired_paying()
            account.prune_expired_pending()


    ###########################################################################

    def run(self):
        self.load_persisted()
        self.provider_stack.listen()
        self.rate_update.run()

        self.connect_loop = LoopingCall(self.retry_connections)
        self.connect_loop.start(5, now=False)

        self.prune_loop = LoopingCall(self.prune_expired_pending)
        self.prune_loop.start(3, now=False)

