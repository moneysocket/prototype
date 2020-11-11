// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Nexus = require("./nexus.js").Nexus;

const RequestRendezvous = require(
    "../message/request/rendezvous.js").RequestRendezvous;


const LAYER_NOTIFICATIONS = new Set(["NOTIFY_RENDEZVOUS",
                                     "NOTIFY_RENDEZVOUS_NOT_READY",
                                     "NOTIFY_RENDEZVOUS_END",
                                   ]);

class OutgoingRendezvousNexus extends Nexus {
    constructor(below_nexus, layer) {
        super(below_nexus, layer);
        this.rendezvousFinishedCb = null;
        this.name = "outgoing rendezvous";
    }

    isLayerMessage(msg) {
        if (msg['message_class'] != "NOTIFICATION") {
            return false;
        }
        return LAYER_NOTIFICATIONS.has(msg['notification_name']);
    }

    onMessage(below_nexus, msg) {
        //console.log("rendezvous nexus got message");
        if (! this.isLayerMessage(msg)) {
            super.onMessage(below_nexus, msg)
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

    onBinMessage(below_nexus, msg_bytes) {
        //console.log("rendezvous nexus got raw message");
    }

    ///////////////////////////////////////////////////////////////////////////

    startRendezvous(rendezvous_id, rendezvousFinishedCb) {
        this.rendezvousFinishedCb = rendezvousFinishedCb;
        this.send(new RequestRendezvous(rendezvous_id));
    }
}

exports.OutgoingRendezvousNexus = OutgoingRendezvousNexus;
