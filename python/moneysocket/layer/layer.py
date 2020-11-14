# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import sys
import logging

class Layer(object):
    def __init__(self):
        self.onlayerevent = None;
        self.onannounce = None;
        self.onrevoke = None;

        self.nexuses = {}
        self.below_nexuses = {}
        self.nexus_by_below = {}
        self.below_by_nexus = {}
        self.announced = {}

    ###########################################################################

    def register_above_layer(self, below_layer):
        below_layer.onannounce = self.announce_nexus
        below_layer.onrevoke = self.revoke_nexus

    def register_layer_event(self, cb, layer_name):
        self.layer_name = layer_name
        self.onlayerevent = cb

    ###########################################################################

    def _track_nexus(self, nexus, below_nexus):
        self.nexuses[nexus.uuid] = nexus
        self.below_nexuses[below_nexus.uuid] = below_nexus
        self.nexus_by_below[below_nexus.uuid] = nexus.uuid
        self.below_by_nexus[nexus.uuid] = below_nexus.uuid
        self.send_layer_event(nexus, "NEXUS_CREATED")

    def _untrack_nexus(self, nexus, below_nexus):
        del self.nexuses[nexus.uuid]
        del self.below_nexuses[below_nexus.uuid]
        del self.nexus_by_below[below_nexus.uuid]
        del self.below_by_nexus[nexus.uuid]
        self.send_layer_event(nexus, "NEXUS_DESTROYED")

    ###########################################################################

    def _track_nexus_announced(self, nexus):
        self.announced[nexus.uuid] = nexus

    def _is_nexus_announced(self, nexus):
        return nexus.uuid in self.announced

    def _track_nexus_revoked(self, nexus):
        assert self._is_nexus_announced(nexus)
        del self.announced[nexus.uuid]

    ###########################################################################

    def announce_nexus(self, below_nexus):
        sys.exit("implement in subclass")

    def revoke_nexus(self, below_nexus):
        nexus = self.nexuses[self.nexus_by_below[below_nexus.uuid]]
        self._untrack_nexus(nexus, below_nexus)
        if self._is_nexus_announced(nexus):
            self._track_nexus_revoked(nexus)
            if self.onrevoke:
                self.onrevoke(nexus)
            self.send_layer_event(nexus, "NEXUS_REVOKED")

    ###########################################################################

    def send_layer_event(self, nexus, status):
        if self.onlayerevent:
            self.onlayerevent(self.layer_name, nexus, status)
