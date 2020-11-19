# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.layer.provider import ProviderLayer
from moneysocket.layer.rendezvous.outgoing import OutgoingRendezvousLayer
from moneysocket.layer.websocket.outgoing import OutgoingWebsocketLayer
from moneysocket.layer.local.outgoing import OutgoingLocalLayer

from moneysocket.stack.incoming import IncomingStack

from terminus.layer import TerminusLayer

class TerminusStack(object):
    def __init__(self, config):
        self.config = config

        self.onannounce = None
        self.onrevoke = None
        self.onstackevent = None
        self.handleproviderinforequest = None
        self.handleinvoicerequest = None
        self.handlepayrequest = None

        # two ways to make a connection: 1) via incoming websocket (that comes
        # through the incoming stack and pass via the local layer) and
        # 2) via outgoing websocket connections we initiate.
        self.local_layer = self.setup_local_layer()
        self.websocket_layer = self.setup_websocket_layer()
        self.rendezvous_layer = self.setup_rendezvous_layer(
            self.websocket_layer, self.local_layer)
        self.provider_layer = self.setup_provider_layer(self.rendezvous_layer)
        self.terminus_layer = self.setup_terminus_layer(self.provider_layer)
        self.incoming_stack = self.setup_incoming_stack(self.config,
                                                        self.local_layer)

    ###########################################################################

    def setup_terminus_layer(self, below_layer):
        l = TerminusLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.send_stack_event, "TERMINUS")
        l.handleinvoicerequest = self.terminus_handle_invoice_request
        l.handlepayrequest = self.terminus_handle_pay_request
        l.handleproviderinforequest = self.terminus_handle_provider_info_request
        return l

    def setup_provider_layer(self, below_layer):
        l = ProviderLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.send_stack_event, "PROVIDER")
        l.handleproviderinforequest = self.terminus_handle_provider_info_request
        return l

    def setup_rendezvous_layer(self, below_layer_1, below_layer_2):
        l = OutgoingRendezvousLayer()
        l.register_above_layer(below_layer_1)
        l.register_above_layer(below_layer_2)
        l.register_layer_event(self.send_stack_event, "OUTGOING_RENDEZVOUS")
        return l

    def setup_websocket_layer(self):
        l = OutgoingWebsocketLayer()
        l.register_layer_event(self.send_stack_event, "OUTGOING_WEBSOCKET")
        return l

    def setup_local_layer(self):
        l = OutgoingLocalLayer()
        l.register_layer_event(self.send_stack_event, "OUTGOING_LOCAL")
        return l

    def setup_incoming_stack(self, config, local_layer):
        s = IncomingStack(config, local_layer)
        return s

    ###########################################################################

    def announce_nexus(self, terminus_nexus):
        if self.onannounce:
            self.onannounce(terminus_nexus)

    def revoke_nexus(self, terminus_nexus):
        if self.onrevoke:
            self.onrevoke(terminus_nexus)

    def send_stack_event(self, layer_name, nexus, status):
        if self.onstackevent:
            self.onstackevent(layer_name, nexus, status)

    ###########################################################################

    def notify_preimage(self, shared_seeds, preimage):
        self.terminus_layer.notify_preimage(shared_seeds, preimage)

    ###########################################################################

    def terminus_handle_provider_info_request(self, shared_seed):
        assert self.handleproviderinforequest
        return self.handleproviderinforequest(shared_seed)

    def terminus_handle_pay_request(self, shared_seed, bolt11):
        assert self.handlepayrequest
        self.handlepayrequest(shared_seed, bolt11)

    def terminus_handle_invoice_request(self, shared_seed, msats):
        assert self.handleinvoicerequest
        return self.handleinvoicerequest(shared_seed, msats)

    ###########################################################################

    def connect(self, location, shared_seed):
        return self.websocket_layer.connect(location, shared_seed)

    def disconnect(self, shared_seed):
        self.websocket_layer.disconnect(shared_seed)

    ###########################################################################

    def local_connect(self, shared_seed):
        self.local_layer.connect(shared_seed)

    def local_disconnect(self, shared_seed):
        self.local_layer.disconnect(shared_seed)

    ###########################################################################

    def listen(self):
        self.incoming_stack.listen()

    def get_listen_locations(self):
        return self.incoming_stack.get_listen_locations()
