// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


class ProtocolLayer {
    constructor(stack, above_layer, layer_name) {
        this.stack = stack;
        this.layer_name = layer_name;

        console.assert(
            typeof stack.postLayerStackEventCb == 'function');
        console.assert(
            typeof above_layer.announceNexusFromBelowCb == 'function');
        console.assert(
            typeof above_layer.revokeNexusFromBelowCb == 'function');
        this.announceNexusAboveCb = (
            above_layer.announceNexusFromBelowCb.bind(above_layer));
        this.revokeNexusAboveCb = (
            above_layer.revokeNexusFromBelowCb.bind(above_layer));

        this.nexuses = {};
        this.below_nexuses = {};
        this.nexus_by_below = {};
        this.below_by_nexus = {};
        this.announced = {};
    }

    _trackNexus(nexus, below_nexus) {
        this.nexuses[nexus.uuid] = nexus;
        this.below_nexuses[below_nexus.uuid] = below_nexus;
        this.nexus_by_below[below_nexus.uuid] = nexus.uuid;
        this.below_by_nexus[nexus.uuid] = below_nexus.uuid;
        this.notifyAppOfStatus(nexus, "NEXUS_CREATED");
    }

    _untrackNexus(nexus, below_nexus) {
        delete this.nexuses[nexus.uuid];
        delete this.below_nexuses[below_nexus.uuid];
        delete this.nexus_by_below[below_nexus.uuid];
        delete this.below_by_nexus[nexus.uuid];
        this.notifyAppOfStatus(nexus, "NEXUS_DESTROYED");
    }

    ///////////////////////////////////////////////////////////////////////////

    _trackNexusAnnounced(nexus) {
        this.announced[nexus.uuid] = nexus;
    }

    _isNexusAnnounced(nexus) {
        return nexus.uuid in this.announced;
    }

    _trackNexusRevoked(nexus) {
        delete this.announced[nexus.uuid];
    }

    ///////////////////////////////////////////////////////////////////////////

    announceNexusFromBelowCb(below_nexus) {
        console.error("implement in subclass");
    }

    revokeNexusFromBelowCb(below_nexus) {
        var nexus = this.nexuses[this.nexus_by_below[below_nexus.uuid]];
        this._untrackNexus(nexus, below_nexus);
        if (this._isNexusAnnounced(nexus)) {
            this._trackNexusRevoked(nexus);
            this.revokeNexusAboveCb(nexus);
            this.notifyAppOfStatus(nexus, "NEXUS_REVOKED");
        }
    }

    notifyAppOfStatus(nexus, status) {
        this.stack.postLayerStackEventCb(this.layer_name, nexus, status);
    }

    ///////////////////////////////////////////////////////////////////////////

    initiateCloseAll() {
        for (var uuid in this.nexuses) {
            var nexus = this.nexuses[uuid];
            nexus.initiateClose();
        }
    }

}

exports.ProtocolLayer = ProtocolLayer;
