# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.beacon.location.websocket import WebsocketLocation
from moneysocket.protocol.rendezvous.outgoing_layer import (
    OutgoingRendezvousLayer)
from moneysocket.protocol.websocket.outgoing_layer import OutgoingWebsocketLayer
from moneysocket.protocol.consumer.layer import ConsumerLayer


class OutgoingConsumerStack(object):
    def __init__(self, app):
        self.app = app
        assert "consumer_online_cb" in dir(self.app)
        assert "consumer_offline_cb" in dir(self.app)
        assert "consumer_report_provider_info_cb" in dir(self.app)
        assert "consumer_report_ping_cb" in dir(self.app)
        assert "consumer_post_stack_event_cb" in dir(self.app)
        assert "consumer_report_bolt11_cb" in dir(self.app)
        assert "consumer_report_preimage_cb" in dir(self.app)

        self.nexus = None
        self.shared_seed = None

        self.consumer_layer = ConsumerLayer(self, self)
        self.rendezvous_layer = OutgoingRendezvousLayer(
            self, self.consumer_layer)
        self.websocket_layer = OutgoingWebsocketLayer(
            self, self.rendezvous_layer)

    ############# transact layer callbacks

    def notify_invoice_cb(self, transact_nexus, bolt11, request_reference_uuid):
        self.app.consumer_report_bolt11_cb(bolt11, request_reference_uuid)

    def notify_preimage_cb(self, transact_nexus, preimage,
                           request_reference_uuid):
        self.app.consumer_report_preimage_cb(preimage, request_reference_uuid)

    ############# consumer layer callbacks

    def notify_provider_cb(self, consumer_nexus, msg):
        provider_info = {'payer':         msg['payer'],
                         'payee':         msg['payee'],
                         'msats':         msg['msats'],
                         'provider_uuid': msg['provider_uuid']}
        self.app.consumer_report_provider_info_cb(provider_info)

    def notify_ping_cb(self, consumer_nexus, msecs):
        self.app.consumer_report_ping_cb(msecs)

    ######## layer callback

    def announce_nexus_from_below_cb(self, below_nexus):
        self.nexus = below_nexus;
        self.shared_seed = below_nexus.get_shared_seed()
        self.app.consumer_online_cb();

    def revoke_nexus_from_below_cb(self, below_nexus):
        self.nexus = None
        self.shared_seed = None
        self.app.consumer_offline_cb()


    def post_layer_stack_event_cb(self, layer_name, nexus, status):
        print("event")
        self.app.consumer_post_stack_event_cb(layer_name, status)


    ######## UI calls these

    def do_connect(self, beacon):
        location = beacon.locations[0]
        shared_seed = beacon.get_shared_seed()
        if type(location) != WebsocketLocation:
            return;
        self.websocket_layer.connect(location, shared_seed)

    def do_disconnect(self):
        self.websocket_layer.initiate_close_all()

    def request_invoice(self, msats, override_request_uuid, description):
        self.nexus.request_invoice(msats, override_request_uuid, description);

    def request_pay(self, bolt11, override_request_uuid):
        self.nexus.request_pay(bolt11, override_request_uuid)
