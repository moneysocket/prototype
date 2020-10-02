# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from moneysocket.protocol.terminus.nexus import TerminusNexus
from moneysocket.protocol.layer import ProtocolLayer


class TerminusLayer(ProtocolLayer):
    def __init__(self, app, above_layer):
        super().__init__(app, above_layer, "TERMINUS")
        assert "terminus_request_invoice" in dir(app)
        assert "terminus_request_pay" in dir(app)
        self.nexuses_by_shared_seed = {}

    def announce_nexus_from_below_cb(self, below_nexus):
        terminus_nexus = TerminusNexus(below_nexus, self)
        self._track_nexus(terminus_nexus, below_nexus)
        self.notify_app_of_status(terminus_nexus, "NEXUS_ANNOUNCED")
        self.announce_nexus_above_cb(terminus_nexus)

        shared_seed = terminus_nexus.get_shared_seed()
        if shared_seed not in self.nexuses_by_shared_seed:
            self.nexuses_by_shared_seed[shared_seed] = set()
        self.nexuses_by_shared_seed[shared_seed].add(terminus_nexus.uuid)

    def revoke_nexus_from_below_cb(self, below_nexus):
        terminus_nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        super().revoke_nexus_from_below_cb(below_nexus)
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

