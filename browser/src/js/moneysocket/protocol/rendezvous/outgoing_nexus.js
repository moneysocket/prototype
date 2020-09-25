// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const ProtocolNexus = require("../nexus.js").ProtocolNexus;

const RequestRendezvous = require(
    "../../message/request/rendezvous.js").RequestRendezvous;


const LAYER_NOTIFICATIONS = new Set(["NOTIFY_RENDEZVOUS",
                                     "NOTIFY_RENDEZVOUS_NOT_READY",
                                     "NOTIFY_RENDEZVOUS_END",
                                   ]);

class OutgoingRendezvousNexus extends ProtocolNexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);
        this.rendezvousFinishedCb = null;
    }


    isLayerMessage(msg) {
        if (msg['message_class'] != "NOTIFICATION") {
            return false;
        }
        return LAYER_NOTIFICATIONS.has(msg['notification_name']);
    }

    recvFromBelowCb(below_nexus, msg) {
        //console.log("rendezvous nexus got message");
        if (! this.isLayerMessage(msg)) {
            super.recvFromBelowCb(below_nexus, msg)
            return;
        }

        if (msg['notification_name'] == "NOTIFY_RENDEZVOUS") {
            this.rendezvousFinishedCb(this);
        } else if (msg['notification_name'] == "NOTIFY_RENDEZVOUS_NOT_READY") {
            console.log("rendezvous not ready, waiting");
        } else if (msg['notification_name'] == "NOTIFY_RENDEZVOUS_END") {
            console.log("rendezvous ended");
            this.initiateClose();
        }
    }

    recvRawFromBelowCb(below_nexus, msg_bytes) {
        //console.log("rendezvous nexus got raw message");
    }

    ///////////////////////////////////////////////////////////////////////////

    startRendezvous(rendezvous_id, rendezvousFinishedCb) {
        this.rendezvousFinishedCb = rendezvousFinishedCb;
        this.send(new RequestRendezvous(rendezvous_id));
    }
}

exports.OutgoingRendezvousNexus = OutgoingRendezvousNexus;
