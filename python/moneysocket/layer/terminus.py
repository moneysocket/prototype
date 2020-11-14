# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.nexus.terminus import TerminusNexus
from moneysocket.layer.layer import Layer


class TerminusLayer(Layer):
    def __init__(self):
        super().__init__()

        self.handleproviderinforequest = None
        self.handleinvoicerequest = None
        self.handlepayrequest = None

        self.nexuses_by_shared_seed = {}

    def setup_terminus_nexus(self, below_nexus):
        n = TerminusNexus(below_nexus, self)
        n.handleproviderinforequest = self.handle_provider_info_request
        n.handleinvoicerequest = self.handle_invoice_request
        n.handlepayrequest = self.handle_pay_request
        return n

    def announce_nexus(self, below_nexus):
        terminus_nexus = self.setup_terminus_nexus(below_nexus)
        self._track_nexus(terminus_nexus, below_nexus)
        self.send_layer_event(terminus_nexus, "NEXUS_ANNOUNCED")
        if self.onannounce:
            self.onannounce(terminus_nexus)

        shared_seed = terminus_nexus.get_shared_seed()
        if shared_seed not in self.nexuses_by_shared_seed:
            self.nexuses_by_shared_seed[shared_seed] = set()
        self.nexuses_by_shared_seed[shared_seed].add(terminus_nexus.uuid)

    def revoke_nexus(self, below_nexus):
        terminus_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        super().revoke_nexus(below_nexus)
        shared_seed = terminus_nexus.get_shared_seed()
        self.nexuses_by_shared_seed[shared_seed].remove(terminus_nexus.uuid)

    def notify_preimage(self, shared_seeds, preimage):
        # TODO figure out what nexus matches shared seed
        # have it pass along notify preimage

        for shared_seed in shared_seeds:
            if shared_seed not in self.nexuses_by_shared_seed:
                continue
            for nexus_uuid in self.nexuses_by_shared_seed[shared_seed]:
                nexus = self.nexuses[nexus_uuid]
                nexus.notify_preimage(preimage)
                nexus.notify_provider_info(shared_seed)

    def handle_pay_request(self, shared_seed, bolt11):
        assert self.handlepayrequest
        return self.handlepayrequest(shared_seed, bolt11);

    def handle_invoice_request(self, shared_seed, msats):
        assert self.handleinvoicerequest
        return self.handleinvoicerequest(shared_seed, msats);

    def handle_provider_info_request(self, shared_seed):
        assert self.handleproviderinforequest
        return self.handleproviderinforequest(shared_seed);
