# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import uuid
import logging
import argparse
from configparser import ConfigParser

from txjsonrpc.web import jsonrpc
from twisted.web import server
from twisted.internet import reactor
from twisted.internet.task import LoopingCall

from moneysocket.utl.bolt11 import Bolt11

from moneysocket.beacon.beacon import MoneysocketBeacon
from moneysocket.beacon.shared_seed import SharedSeed
from moneysocket.stack.incoming import IncomingStack
from moneysocket.wad.wad import Wad

from terminus.rpc import TerminusRpc
from terminus.account import Account
from terminus.account_db import AccountDb
from terminus.directory import TerminusDirectory
from terminus.stack import TerminusStack


class TerminusApp(object):
    def __init__(self, config, lightning):
        self.config = config
        self.lightning = lightning
        self.lightning.register_paid_recv_cb(self.node_received_payment_cb)

        AccountDb.PERSIST_DIR = self.config['App']['AccountPersistDir']

        self.directory = TerminusDirectory()
        self.terminus_stack = self.setup_terminus_stack()

        TerminusRpc.APP = self

        self.connect_loop = None
        self.prune_loop = None

    ###########################################################################

    def setup_terminus_stack(self):
        s = TerminusStack(self.config)
        s.onannounce = self.on_announce
        s.onrevoke = self.on_revoke
        s.onstackevent = self.on_stack_event
        s.handleproviderinforequest = self.handle_provider_info_request
        s.handleinvoicerequest = self.terminus_handle_invoice_request
        s.handlepayrequest = self.terminus_handle_pay_request
        return s

    ###########################################################################

    def on_announce(self, terminus_nexus):
        # TODO - register for messages and log errors if we get any not handled
        # by the stack?
        pass

    def on_revoke(self, terminus_nexus):
        pass

    def on_stack_event(self, layer_name, nexus, status):
        pass

    ###########################################################################

    def handle_provider_info_request(self, shared_seed):
        account = self.directory.lookup_by_seed(shared_seed)
        assert account is not None, "shared seed not from known account?"
        return account.get_provider_info()

    ###########################################################################

    def terminus_handle_pay_request(self, shared_seed, bolt11):
        # TODO - this should be a request-> callback to allow for an
        # asynchronous call to the daemon.

        account = self.directory.lookup_by_seed(shared_seed)
        assert account is not None, "shared seed not from known account?"

        msats = Bolt11.get_msats(bolt11)
        wad = account.get_wad()
        if msats > wad['msats']:
            return # msatoshi balance exceeded

        # TODO handle failure
        preimage, paid_msats = self.lightning.pay_invoice(bolt11)

        paid_wad = Wad.bitcoin(paid_msats)

        account.subtract_wad(paid_wad)

        shared_seeds = account.get_all_shared_seeds()
        # TODO pay preimage
        self.terminus_stack.notify_preimage(shared_seeds, preimage)

    def terminus_handle_invoice_request(self, shared_seed, msats):
        # TODO - this should be a request-> callback to allow for an
        # asynchronous call to the daemon.

        account = self.directory.lookup_by_seed(shared_seed)
        assert account is not None, "shared seed not from known account?"

        # TODO handle failure
        bolt11 = self.lightning.get_invoice(msats)
        payment_hash = Bolt11.get_payment_hash(bolt11)
        account.add_pending(payment_hash, bolt11)
        self.directory.reindex_account(account)
        return {'bolt11': bolt11}


    ###########################################################################

    def node_received_payment_cb(self, preimage, msats):
        received_wad = Wad.bitcoin(msats)
        logging.info("node received payment: %s %s" % (preimage, received_wad))

        payment_hash = Bolt11.preimage_to_payment_hash(preimage)
        # find accounts with this payment_hash
        accounts = self.directory.lookup_by_payment_hash(payment_hash)

        if len(accounts) > 1:
            logging.error("can't deal with more than one account with "
                          "a preimage collision yet")
            # TODO deal with this somehow - feed preimage back into lightning
            # node to claim any pending htlcs?

        if len(accounts) == 0:
            logging.error("incoming payment not known")
            return

        account = list(accounts)[0]
        shared_seeds = account.get_all_shared_seeds()
        account.remove_pending(payment_hash)
        account.add_wad(received_wad)
        self.terminus_stack.notify_preimage(shared_seeds, preimage)

    ##########################################################################

    def _iter_getinfo_lines(self):
        locations = self.terminus_stack.get_listen_locations()
        accounts = self.directory.get_account_list()
        yield "ACCOUNTS:"
        if len(accounts) == 0:
            yield "\t(none)"
        for account in accounts:
            yield "%s" % (account.summary_string(locations))

    def getinfo(self, args):
        return "\n".join(self._iter_getinfo_lines())

    ##########################################################################

    def gen_account_name(self):
        i = 0
        def account_name(n):
            return "account-%d" % n
        while self.directory.lookup_by_name(account_name(i)) is not None:
            i += 1
        return account_name(i)


    def create(self, args):
        wad, err = Wad.bitcoin_from_msat_string(args.msatoshis)
        if err:
            return "*** " + err

        name = self.gen_account_name()
        account = Account(name)
        account.set_wad(wad)
        self.directory.add_account(account)
        return "created account: %s  wad: %s" % (name, wad)

    ##########################################################################

    def rm(self, args):
        name = args.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        if len(account.get_all_shared_seeds()) > 0:
            return "*** still has connections: %s" % name

        self.directory.remove_account(account)
        account.depersist()
        return "removed: %s" % name

    ##########################################################################

    def connect(self, args):
        name = args.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        beacon_str = args.beacon

        beacon, err = MoneysocketBeacon.from_bech32_str(beacon_str)
        if err:
            return "*** could not decode beacon: %s" % err
        location = beacon.locations[0]
        if location.to_dict()['type'] != "WebSocket":
            return "*** can't connect to beacon location"

        shared_seed = beacon.shared_seed
        connection_attempt = self.terminus_stack.connect(location, shared_seed)
        account.add_connection_attempt(beacon, connection_attempt)
        account.add_beacon(beacon)
        self.directory.reindex_account(account)
        return "connected: %s to %s" % (name, str(location))


    ##########################################################################

    def listen(self, args):
        name = args.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        shared_seed_str = args.shared_seed
        if shared_seed_str:
            shared_seed = SharedSeed.from_hex_str(shared_seed_str)
            if not shared_seed:
                return ("*** could not understand shared seed: %s" %
                        args.shared_seed)
            beacon = MoneysocketBeacon(shared_seed)
        else:
            # generate a shared_seed
            beacon = MoneysocketBeacon()
            shared_seed = beacon.shared_seed

        # generate new beacon
        # location is the terminus_stack's incoming websocket
        beacon.locations = self.terminus_stack.get_listen_locations()
        account.add_shared_seed(shared_seed)
        # register shared seed with local listener
        self.terminus_stack.local_connect(shared_seed)
        self.directory.reindex_account(account)
        return "listening: %s to %s" % (name, beacon)

    ##########################################################################

    def clear(self, args):
        name = args.account
        account = self.directory.lookup_by_name(name)
        if not account:
            return "*** unknown account: %s" % name

        # TODO - cli for more precice removal of connection?

        # outgoing websocket layer -> find all that have this shared seed
        # initiate close to disconnect
        for beacon in account.get_beacons():
            shared_seed = beacon.get_shared_seed()
            self.terminus_stack.disconnect(shared_seed)
            account.remove_beacon(beacon)

        # deregister from local layer
        for shared_seed in account.get_shared_seeds():
            self.terminus_stack.local_disconnect(shared_seed)
            account.remove_shared_seed(shared_seed)
        self.directory.reindex_account(account)
        return "cleared connections for %s" % (args.account)

    ##########################################################################

    def load_persisted(self):
        for account in Account.iter_persisted_accounts():
            self.directory.add_account(account)
            for beacon in account.get_beacons():
                location = beacon.locations[0]
                assert location.to_dict()['type'] == "WebSocket"
                shared_seed = beacon.shared_seed
                connection_attempt = self.terminus_stack.connect(location,
                                                                 shared_seed)
                account.add_connection_attempt(beacon, connection_attempt)
            for shared_seed in account.get_shared_seeds():
                self.terminus_stack.local_connect(shared_seed)

    ##########################################################################

    def retry_connections(self):
        for account in self.directory.iter_accounts():
            disconnected_beacons = account.get_disconnected_beacons()
            for beacon in disconnected_beacons:
                #logging.error("disconnected: %s" % beacon.to_bech32_str())
                location = beacon.locations[0]
                assert location.to_dict()['type'] == "WebSocket"
                shared_seed = beacon.shared_seed
                connection_attempt = self.terminus_stack.connect(location,
                                                                 shared_seed)
                account.add_connection_attempt(beacon, connection_attempt)

    def prune_expired_pending(self):
        for account in self.directory.iter_accounts():
            account.prune_expired_pending()

    ##########################################################################

    def run_app(self):
        rpc_interface = self.config['Rpc']['BindHost']
        rpc_port = int(self.config['Rpc']['BindPort'])
        logging.info("listening on %s:%d" % (rpc_interface, rpc_port))
        reactor.listenTCP(rpc_port, server.Site(TerminusRpc()),
                          interface=rpc_interface)

        self.load_persisted()

        self.terminus_stack.listen()

        self.connect_loop = LoopingCall(self.retry_connections)
        self.connect_loop.start(5, now=False)

        self.prune_loop = LoopingCall(self.prune_expired_pending)
        self.prune_loop.start(3, now=False)
