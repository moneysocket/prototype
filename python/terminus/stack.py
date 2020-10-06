# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.terminus.layer import TerminusLayer
from moneysocket.protocol.provider.layer import ProviderLayer
from moneysocket.protocol.rendezvous.outgoing_layer import (
    OutgoingRendezvousLayer)
from moneysocket.protocol.websocket.outgoing_layer import OutgoingWebsocketLayer
from moneysocket.protocol.local.outgoing_layer import OutgoingLocalLayer

class TerminusStack(object):
    def __init__(self, app):
        self.app = app
        self.terminus_layer = TerminusLayer(self, self)
        self.provider_layer = ProviderLayer(self, self.terminus_layer)
        self.rendezvous_layer = OutgoingRendezvousLayer(
            self, self.provider_layer)
        # two ways to make a connection: 1) via incoming websocket (that comes
        # through the incoming stack and pass via the local layer) and
        # 2) via outgoing websocket connections we initiate.
        self.outgoing_websocket_layer = OutgoingWebsocketLayer(
            self, self.rendezvous_layer)
        self.local_layer = OutgoingLocalLayer(self, self.rendezvous_layer)

    def get_local_layer(self):
        return self.local_layer

    def announce_nexus_from_below_cb(self, terminus_nexus):
        self.app.announce_nexus_from_below_cb(terminus_nexus)

    def revoke_nexus_from_below_cb(self, terminus_nexus):
        self.app.revoke_nexus_from_below_cb(terminus_nexus)

    def post_layer_stack_event_cb(self, layer_name, nexus, status):
        self.app.post_layer_stack_event_cb(layer_name, nexus, status)

    def get_provider_info(self, shared_seed):
        return self.app.get_provider_info(shared_seed)

    def terminus_request_pay(self, shared_seed, bolt11):
        self.app.terminus_request_pay(shared_seed, bolt11)

    def terminus_request_invoice(self, shared_seed, msats):
        self.app.terminus_request_invoice(shared_seed, msats)

    def connect(self, location, shared_seed):
        return self.outgoing_websocket_layer.connect(location, shared_seed)

    def disconnect(self, shared_seed):
        self.outgoing_websocket_layer.disconnect(shared_seed)
