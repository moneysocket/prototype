# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.beacon.location.websocket import WebsocketLocation
from moneysocket.layer.rendezvous.outgoing import OutgoingRendezvousLayer
from moneysocket.layer.websocket.outgoing import OutgoingWebsocketLayer
from moneysocket.layer.consumer import ConsumerLayer
from moneysocket.layer.transact.consumer import ConsumerTransactLayer


class ConsumerStack(object):
    def __init__(self):
        self.onannounce = None
        self.onrevoke = None
        self.onstackevent = None
        self.onproviderinfo = None
        self.onping = None
        self.oninvoice = None
        self.onpreimage = None

        assert self.rendezvous_layer # setup in subclass
        self.consumer_layer = self.setup_consumer_layer(self.rendezvous_layer)
        self.transact_layer = self.setup_transact_layer(self.consumer_layer)

    ###########################################################################

    def setup_consumer_layer(self, below_layer):
        l = ConsumerLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.send_stack_event, "CONSUMER")
        l.onping = self.on_ping
        return l

    def setup_transact_layer(self, below_layer):
        l = ConsumerTransactLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.send_stack_event, "CONSUMER_TRANSACT")
        l.oninvoice = self.on_invoice
        l.onpreimage = self.on_preimage
        l.onproviderinfo = self.on_provider_info
        return l

    ############# transact layer callbacks

    def on_invoice(self, transact_nexus, bolt11, request_reference_uuid):
        if self.oninvoice:
            self.oninvoice(transact_nexus, bolt11, request_reference_uuid)

    def on_preimage(self, transact_nexus, preimage, request_reference_uuid):
        if self.onpreimage:
            self.onpreimage(transact_nexus, preimage, request_reference_uuid)

    ############# consumer layer callbacks

    def on_provider_info(self, transact_nexus, msg):
        provider_info = {'payer':         msg['payer'],
                         'payee':         msg['payee'],
                         'wad':           msg['wad'],
                         'account_uuid':  msg['account_uuid']}
        if self.onproviderinfo:
            self.onproviderinfo(transact_nexus, provider_info)

    def on_ping(self, transact_nexus, msecs):
        if self.onping:
            self.onping(msecs)

    ######## layer callback

    def on_announce(self, below_nexus):
        if self.onannounce:
            self.onannounce(below_nexus);

    def on_revoke(self, below_nexus):
        if self.onrevoke:
            self.onrevoke(below_nexus)


    def send_stack_event(self, layer_name, nexus, status):
        if self.onstackevent:
            self.onstackevent(layer_name, nexus, status)

    ######## UI calls these

    def do_connect(self, beacon):
        # implement in subclass
        pass

    def do_disconnect(self):
        # implement in subclass
        pass

    def request_invoice(self, nexus_uuid, msats, description):
        return self.transact_layer.request_invoice(nexus_uuid, msats,
                                                   description)

    def request_pay(self, nexus_uuid, bolt11):
         return self.transact_layer.request_pay(nexus_uuid, bolt11)


class OutgoingConsumerStack(ConsumerStack):
    def __init__(self):
        self.websocket_layer = self.setup_websocket_layer()
        self.rendezvous_layer = self.setup_rendezvous_layer(
            self.websocket_layer)
        super().__init__()

    ###########################################################################

    def setup_rendezvous_layer(self, below_layer):
        l = OutgoingRendezvousLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.send_stack_event, "OUTGOING_RENDEZVOUS")
        return l

    def setup_websocket_layer(self):
        l = OutgoingWebsocketLayer()
        l.register_layer_event(self.send_stack_event, "OUTGOING_WEBSOCKET")
        return l

    ###########################################################################

    def do_connect(self, beacon):
        location = beacon.locations[0]
        shared_seed = beacon.get_shared_seed()
        if type(location) != WebsocketLocation:
            return None;
        return self.websocket_layer.connect(location, shared_seed)

    def do_disconnect(self):
        self.websocket_layer.initiate_close_all()


# TODO incoming websocket stack
