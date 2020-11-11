// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Uuid = require('../utl/uuid.js').Uuid;

class Nexus {
    constructor(below_nexus, layer) {
        this.uuid = Uuid.uuidv4();
        this.below_nexus = below_nexus;
        this.layer = layer;

        this.onmessage = null;
        this.onbinmessage = null;
        this.registerAboveNexus(below_nexus);
    }

    registerAboveNexus(below_nexus) {
        below_nexus.onmessage = (function(nexus, msg) {
            this.onMessage(nexus, msg);
        }).bind(this);
        below_nexus.onbinmessage = (function(nexus, msg_bytes) {
            this.onBinMessage(nexus, msg_bytes);
        }).bind(this);
    }


    isEqual(other) {
        if (other == null) {
            return false;
        }
        return this.uuid == other.uuid;
    }
    //////////////////////////////////////////////////////////////////////////

    getDownwardNexusList() {
        var below_list = this.below_nexus.getDownwardNexusList();
        below_list.push(this);
        return below_list;
    }

    downlineStr() {
        var s = "";
        var nexus_list = this.getDownwardNexusList();
        for (var i=0; i < nexus_list.length; i++) {
            s = s + nexus_list[i].toString() + "\n";
        }
        return s.trim();
    }

    toString() {
        return this.constructor.name + " uuid: " + this.uuid;
    }

    //////////////////////////////////////////////////////////////////////////

    send(msg) {
        this.below_nexus.send(msg);
    }

    sendBin(msg_bytes) {
        this.below_nexus.sendBin(msg_bytes);
    }

    initiateClose() {
        this.below_nexus.initiateClose();
    }

    //////////////////////////////////////////////////////////////////////////

    onMessage(below_nexus, msg) {
        if (this.onmessage != null) {
            this.onmessage(below_nexus, msg)
        }
    }

    onBinMessage(below_nexus, msg_bytes) {
        if (this.onbinmessage != null) {
            this.onbinmessage(below_nexus, msg_bytes)
        }
    }

    //////////////////////////////////////////////////////////////////////////

    getSharedSeed() {
        return this.below_nexus.getSharedSeed();
    }
}


exports.Nexus = Nexus;
