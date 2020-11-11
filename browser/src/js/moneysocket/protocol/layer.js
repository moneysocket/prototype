// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


class Layer {
    constructor() {
        this.onlayerevent = null;
        this.onannounce = null;
        this.onrevoke = null;

        this.nexuses = {};
        this.below_nexuses = {};
        this.nexus_by_below = {};
        this.below_by_nexus = {};
        this.announced = {};
    }

    ///////////////////////////////////////////////////////////////////////////

    registerAboveLayer(below_layer) {
        below_layer.onannounce = (function(nexus) {
            this.announceNexus(nexus);
        }).bind(this);
        below_layer.onrevoke = (function(nexus) {
            this.revokeNexus(nexus);
        }).bind(this);
    }

    ///////////////////////////////////////////////////////////////////////////

    _trackNexus(nexus, below_nexus) {
        this.nexuses[nexus.uuid] = nexus;
        this.below_nexuses[below_nexus.uuid] = below_nexus;
        this.nexus_by_below[below_nexus.uuid] = nexus.uuid;
        this.below_by_nexus[nexus.uuid] = below_nexus.uuid;
        this.sendLayerEvent(nexus, "NEXUS_CREATED");
    }

    _untrackNexus(nexus, below_nexus) {
        delete this.nexuses[nexus.uuid];
        delete this.below_nexuses[below_nexus.uuid];
        delete this.nexus_by_below[below_nexus.uuid];
        delete this.below_by_nexus[nexus.uuid];
        this.sendLayerEvent(nexus, "NEXUS_DESTROYED");
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

    announceNexus(below_nexus) {
        console.error("implement in subclass");
    }

    revokeNexus(below_nexus) {
        var nexus = this.nexuses[this.nexus_by_below[below_nexus.uuid]];
        this._untrackNexus(nexus, below_nexus);
        if (this._isNexusAnnounced(nexus)) {
            this._trackNexusRevoked(nexus);

            if (this.onrevoke != null) {
                this.onrevoke(nexus);
            }
            this.sendLayerEvent(nexus, "NEXUS_REVOKED");
        }
    }

    sendLayerEvent(nexus, status) {
        if (this.onlayerevent != null) {
            this.onlayerevent(nexus, status);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    initiateCloseAll() {
        for (var uuid in this.nexuses) {
            var nexus = this.nexuses[uuid];
            nexus.initiateClose();
        }
    }

}

exports.Layer = Layer;
