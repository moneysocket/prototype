# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


from moneysocket.layer.transact.provider import ProviderTransactLayer
from moneysocket.layer.provider import ProviderLayer
from moneysocket.layer.rendezvous.outgoing import OutgoingRendezvousLayer
from moneysocket.layer.websocket.outgoing import OutgoingWebsocketLayer
from moneysocket.layer.local.outgoing import OutgoingLocalLayer

from moneysocket.stack.incoming import IncomingStack

class BidirectionalProviderStack(object):
    def __init__(self, config):
        self.config = config

        self.onannounce = None
        self.onrevoke = None
        self.onstackevent = None
        self.handleproviderinforequest = None
        self.handleinvoicerequest = None
        self.handlepayrequest = None

        self.local_layer = self.setup_local_layer()
        self.websocket_layer = self.setup_websocket_layer()
        self.rendezvous_layer = self.setup_rendezvous_layer(
            self.websocket_layer, self.local_layer)
        self.provider_layer = self.setup_provider_layer(self.rendezvous_layer)
        self.transact_layer = self.setup_transact_layer(self.provider_layer)
        self.incoming_stack = self.setup_incoming_stack(self.config,
                                                        self.local_layer)

    ###########################################################################

    def setup_transact_layer(self, below_layer):
        l = ProviderTransactLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.send_stack_event, "PROVIDER_TRANSACT")
        l.handleinvoicerequest = self.handle_invoice_request
        l.handlepayrequest = self.handle_pay_request
        l.handleproviderinforequest = self.handle_provider_info_request
        return l

    def setup_provider_layer(self, below_layer):
        l = ProviderLayer()
        l.register_above_layer(below_layer)
        l.register_layer_event(self.send_stack_event, "PROVIDER")
        l.handleproviderinforequest = self.handle_provider_info_request
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

    def handle_invoice_request(self, nexus, msats, request_uuid):
        assert self.handleinvoicerequest
        err = self.handleinvoicerequest(nexus, msats, request_uuid)
        if err:
            print("couldn't get invoice: %s" % err)
            # TODO - send back error
            return

    def fulfil_request_invoice_cb(self, nexus_uuid, bolt11,
                                  request_reference_uuid):
        self.transact_layer.fulfil_request_invoice(nexus_uuid, bolt11,
                                                   request_reference_uuid)

    def handle_pay_request(self, nexus, bolt11, request_uuid):
        assert self.handlepayrequest
        err = self.handlepayrequest(nexus, bolt11, request_uuid)
        if err:
            print("couldn't get invoice: %s" % err)
            # TODO - send back error
            return

    def notify_preimage(self, shared_seeds, preimage, request_reference_uuid):
        self.transact_layer.notify_preimage(shared_seeds, preimage,
                                            request_reference_uuid)

    def notify_provider_info(self, shared_seeds):
        self.transact_layer.notify_provider_info(shared_seeds)

    ###########################################################################

    def announce_nexus(self, transact_nexus):
        if self.onannounce:
            self.onannounce(transact_nexus)

    def revoke_nexus(self, transact_nexus):
        if self.onrevoke:
            self.onrevoke(transact_nexus)

    def send_stack_event(self, layer_name, nexus, status):
        if self.onstackevent:
            self.onstackevent(layer_name, nexus, status)

    ###########################################################################

    def handle_provider_info_request(self, shared_seed):
        assert self.handleproviderinforequest
        provider_info = self.handleproviderinforequest(shared_seed)
        print("got: %s" % provider_info)
        return provider_info

    def provider_now_ready_from_app(self, shared_seed):
        self.provider_layer.provider_now_ready_from_app(shared_seed)

    ###########################################################################

    def connect(self, location, shared_seed):
        c = self.websocket_layer.connect(location, shared_seed)
        #print("connecting got: %s" % c)
        return c

    def disconnect(self, shared_seed):
        self.websocket_layer.disconnect(shared_seed)

    ###########################################################################

    def local_connect(self, shared_seed):
        self.local_layer.connect(shared_seed)

    def local_disconnect(self, shared_seed):
        self.local_layer_disconnect(shared_seed)

    ###########################################################################

    def listen(self):
        self.incoming_stack.listen()

    def get_listen_locations(self):
        return self.incoming_stack.get_listen_locations()
