# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


from moneysocket.protocol.transact.provider_layer import ProviderTransactLayer
from moneysocket.protocol.provider.layer import ProviderLayer
from moneysocket.protocol.rendezvous.outgoing_layer import (
    OutgoingRendezvousLayer)
from moneysocket.protocol.websocket.outgoing_layer import OutgoingWebsocketLayer
from moneysocket.protocol.local.outgoing_layer import OutgoingLocalLayer

from moneysocket.stack.incoming import IncomingStack

class BidirectionalProviderStack(object):
    def __init__(self, config, app):
        self.config = config
        self.app = app

        self.transact_layer = ProviderTransactLayer(self, self)
        self.provider_layer = ProviderLayer(self, self.transact_layer)
        self.rendezvous_layer = OutgoingRendezvousLayer(
            self, self.provider_layer)

        self.outgoing_websocket_layer = OutgoingWebsocketLayer(
            self, self.rendezvous_layer)
        self.local_layer = OutgoingLocalLayer(self, self.rendezvous_layer)
        self.incoming_stack = IncomingStack(self.config, self.local_layer)


    def announce_nexus_from_below_cb(self, transact_nexus):
        pass

    def revoke_nexus_from_below_cb(self, transact_nexus):
        pass

    def post_layer_stack_event_cb(self, layer_name, nexus, status):
        pass

    def get_provider_info(self, shared_seed):
        return {}


    def listen(self):
        self.incoming_stack.listen()


    def got_request_invoice_cb(self, msats, request_uuid):
        pass

    def got_request_pay_cb(self, bolt11, request_uuid):
        pass

