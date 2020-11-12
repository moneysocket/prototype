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
    def __init__(self, config, app):
        self.config = config
        self.app = app

        assert "get_provider_info" in dir(app)
        assert "provider_post_stack_event_cb" in dir(app)
        assert "provider_online_cb" in dir(app)
        assert "provider_offline_cb" in dir(app)
        assert "provider_requesting_invoice_cb" in dir(app)
        assert "provider_requesting_pay_cb" in dir(app)

        self.transact_layer = ProviderTransactLayer(self, self)
        self.provider_layer = ProviderLayer(self, self.transact_layer)
        self.rendezvous_layer = OutgoingRendezvousLayer(
            self, self.provider_layer)

        self.outgoing_websocket_layer = OutgoingWebsocketLayer(
            self, self.rendezvous_layer)
        self.local_layer = OutgoingLocalLayer(self, self.rendezvous_layer)
        self.incoming_stack = IncomingStack(self.config, self.local_layer)


    ###########################################################################

    def got_request_invoice_cb(self, nexus, msats, request_uuid):
        err = self.app.provider_requesting_invoice_cb(nexus, msats,
                                                      request_uuid)
        if err:
            print("couldn't get invoice: %s" % err)
            # TODO - send back error
            return


    def fulfil_request_invoice_cb(self, nexus_uuid, bolt11,
                                  request_reference_uuid):
        self.transact_layer.fulfil_request_invoice(nexus_uuid, bolt11,
                                                   request_reference_uuid)

    def got_request_pay_cb(self, nexus, bolt11, request_uuid):
        err = self.app.provider_requesting_pay_cb(nexus, bolt11,
                                                  request_uuid)
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

    def announce_nexus_from_below_cb(self, transact_nexus):
        self.app.provider_online_cb(transact_nexus)

    def revoke_nexus_from_below_cb(self, transact_nexus):
        self.app.provider_offline_cb(transact_nexus)

    def post_layer_stack_event_cb(self, layer_name, nexus, status):
        self.app.provider_post_stack_event_cb(layer_name, nexus, status)

    ###########################################################################

    def get_provider_info(self, shared_seed):
        provider_info = self.app.get_provider_info(shared_seed)
        print("got: %s" % provider_info)
        return provider_info

    def provider_now_ready_from_app(self, shared_seed):
        self.provider_layer.provider_now_ready_from_app(shared_seed)

    ###########################################################################

    def connect(self, location, shared_seed):
        c = self.outgoing_websocket_layer.connect(location, shared_seed)
        #print("connecting got: %s" % c)
        return c

    def disconnect(self, shared_seed):
        self.outgoing_websocket_layer.disconnect(shared_seed)

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
