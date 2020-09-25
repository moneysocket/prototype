// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Uuid = require('../utl/uuid.js').Uuid;

class ProtocolNexus {
    constructor(below_nexus, layer) {
        this.uuid = Uuid.uuidv4();
        this.below_nexus = below_nexus;
        this.layer = layer;

        this.upwardRecvCb = null;
        this.upwardRecvRawCb = null;

        this.below_nexus.registerUpwardRecvCb(
            this.recvFromBelowCb.bind(this));
        this.below_nexus.registerUpwardRecvRawCb(
            this.recvRawFromBelowCb.bind(this));
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

    sendRaw(msg_bytes) {
        this.below_nexus.sendRaw(msg_bytes);
    }

    initiateClose() {
        this.below_nexus.initiateClose();
    }

    //////////////////////////////////////////////////////////////////////////


    recvFromBelowCb(below_nexus, msg) {
        console.assert(below_nexus.uuid == this.below_nexus.uuid);
        this.upwardRecvCb(this, msg);
    }

    recvRawFromBelowCb(below_nexus, msg_bytes) {
        console.assert(below_nexus.uuid == this.below_nexus.uuid);
        this.upwardRecvRawCb(this, msg_bytes);
    }

    //////////////////////////////////////////////////////////////////////////

    registerUpwardRecvCb(upward_recv_cb) {
        this.upwardRecvCb = upward_recv_cb;
    }

    registerUpwardRecvRawCb(upward_recv_raw_cb) {
        this.upwardRecvRawCb = upward_recv_raw_cb;
    }

    //////////////////////////////////////////////////////////////////////////
    getSharedSeed() {
        return this.below_nexus.getSharedSeed();
    }
}


exports.ProtocolNexus = ProtocolNexus;
