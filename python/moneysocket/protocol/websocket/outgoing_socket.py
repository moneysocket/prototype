# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import logging
import uuid

from autobahn.twisted.websocket import WebSocketClientProtocol

from moneysocket.message.codec import MessageCodec


class OutgoingSocket(WebSocketClientProtocol):
    """ Makes the autobahn websocket client look like a Nexus to
        be passed upwards.
    """
    def __init__(self):
        super().__init__()
        self.uuid = uuid.uuid4()

        self.upward_recv_cb = None
        self.upward_recv_raw_cb = None

        self.was_announced = False

    def onConnecting(self, transport_details):
        logging.info("WebSocket connecting: %s" % transport_details)

    def onConnect(self, response):
        logging.info("WebSocket connection connect: %s" % response)

    def onOpen(self):
        logging.info("WebSocket connection open.")

        # announce self as nexus to the protocol layer
        self.factory.ms_protocol_layer.announce_nexus_from_below_cb(self)
        self.was_announced = True

    def onMessage(self, payload, isBinary):
        logging.info("outgoing message")
        if isBinary:
            logging.info("binary payload: %d bytes" % len(payload))
            shared_seed = self.factory.ms_shared_seed
            msg, err = MessageCodec.wire_decode(payload,
                shared_seed=shared_seed)
            if err:
                logging.error("could not decode: %s" % err)
                return
            logging.info("recv msg: %s" % msg)
            self.upward_recv_cb(self, msg)
        else:
            logging.info("text payload: %s" % payload.decode("utf8"))
            logging.error("text payload is unexpected, dropping")

    def onClose(self, wasClean, code, reason):
        logging.info("connection closed %s %s %s" % (wasClean, code, reason))

        if self.was_announced:
            self.factory.ms_protocol_layer.revoke_nexus_from_below_cb(self)

    ##########################################################################

    # stringify self like this a nexus

    def downward_iter_nexuses(self):
        # this is the bottom
        yield self

    def downline_str(self):
        return "\n".join([str(n) for n in self.downward_iter_nexuses()])

    def __str__(self):
        return "%-016s uuid: %s" % (self.__class__.__name__, self.uuid)

    ##########################################################################

    # protocol layer will assign a parent nexus and it will register for
    # message and close notifications

    def register_upward_recv_cb(self, upward_recv_cb):
        self.upward_recv_cb = upward_recv_cb

    def register_upward_recv_raw_cb(self, upward_recv_raw_cb):
        self.upward_recv_raw_cb = upward_recv_raw_cb


    ##########################################################################

    # Act like a nexus, but interface to WebSocket goo underneath

    def send(self, msg):
        logging.info("encoding msg: %s" % msg)
        shared_seed = self.factory.ms_shared_seed
        msg_bytes = MessageCodec.wire_encode(msg, shared_seed=shared_seed)
        self.send_raw(msg_bytes)

    def send_raw(self, msg_bytes):
        s = self.sendMessage(msg_bytes, isBinary=True)
        logging.info("sent message %d bytes, got: %s" % (len(msg_bytes), s))

    def initiate_close(self):
        super().sendClose()

    ##########################################################################

    def get_shared_seed(self):
        # the above layer is almost always the rendezvous layer and it needs
        # to match the encryption with a derived rendezvous_id
        return self.factory.ms_shared_seed
