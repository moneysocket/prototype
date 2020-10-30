# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.beacon.location.websocket import WebsocketLocation
from moneysocket.protocol.rendezvous.outgoing_layer import (
    OutgoingRendezvousLayer)
from moneysocket.protocol.websocket.outgoing_layer import OutgoingWebsocketLayer
from moneysocket.protocol.consumer.layer import ConsumerLayer
from moneysocket.protocol.transact.consumer_layer import ConsumerTransactLayer


class ConsumerStack(object):
    def __init__(self, app):
        self.app = app
        assert "consumer_online_cb" in dir(self.app)
        assert "consumer_offline_cb" in dir(self.app)
        assert "consumer_report_provider_info_cb" in dir(self.app)
        assert "consumer_report_ping_cb" in dir(self.app)
        assert "consumer_post_stack_event_cb" in dir(self.app)
        assert "consumer_report_bolt11_cb" in dir(self.app)
        assert "consumer_report_preimage_cb" in dir(self.app)

        self.transact_layer = ConsumerTransactLayer(self, self)
        self.consumer_layer = ConsumerLayer(self, self.transact_layer)


    ############# transact layer callbacks

    def notify_invoice_cb(self, transact_nexus, bolt11, request_reference_uuid):
        self.app.consumer_report_bolt11_cb(transact_nexus, bolt11,
                                           request_reference_uuid)

    def notify_preimage_cb(self, transact_nexus, preimage,
                           request_reference_uuid):
        self.app.consumer_report_preimage_cb(transact_nexus, preimage,
                                             request_reference_uuid)

    ############# consumer layer callbacks

    def notify_provider_cb(self, transact_nexus, msg):
        provider_info = {'payer':         msg['payer'],
                         'payee':         msg['payee'],
                         'wad':           msg['wad'],
                         'account_uuid':  msg['account_uuid']}
        self.app.consumer_report_provider_info_cb(transact_nexus, provider_info)

    def notify_ping_cb(self, transact_nexus, msecs):
        self.app.consumer_report_ping_cb(msecs)

    ######## layer callback

    def announce_nexus_from_below_cb(self, below_nexus):
        self.app.consumer_online_cb(below_nexus);

    def revoke_nexus_from_below_cb(self, below_nexus):
        self.app.consumer_offline_cb(below_nexus)


    def post_layer_stack_event_cb(self, layer_name, nexus, status):
        self.app.consumer_post_stack_event_cb(layer_name, nexus, status)


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
    def __init__(self, app):
        super().__init__(app)
        self.rendezvous_layer = OutgoingRendezvousLayer(
            self, self.consumer_layer)
        self.websocket_layer = OutgoingWebsocketLayer(
            self, self.rendezvous_layer)

    def do_connect(self, beacon):
        location = beacon.locations[0]
        shared_seed = beacon.get_shared_seed()
        if type(location) != WebsocketLocation:
            return None;
        return self.websocket_layer.connect(location, shared_seed)

    def do_disconnect(self):
        self.websocket_layer.initiate_close_all()


# TODO incoming websocket stack
