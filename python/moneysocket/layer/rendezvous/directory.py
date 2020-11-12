# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

class RendezvousDirectory(object):
    def __init__(self):
        self.nexuses_by_uuid = {}
        self.rids_by_uuids = {}
        self.unpeered_uuids_by_rid = {}
        self.uuid_peers = {}
        self.rids_peered = set()

    def __str__(self):
        nexuses = len(self.nexuses_by_uuid)
        unpeered = len(self.unpeered_uuids_by_rid)
        peered = len(self.uuid_peers)
        return "nexuses/unpeered/peered: %d/%d/%d" % (nexuses, unpeered, peered)

    def get_peer_nexus(self, nexus):
        return (self.nexuses_by_uuid[self.uuid_peers[nexus.uuid]] if
                (nexus.uuid in self.uuid_peers) else None)

    def is_nexus_in_directory(self, nexus):
        return nexus.uuid in self.nexuses_by_uuid

    def is_rid_peered(self, rendezvous_id):
        return rendezvous_id in self.rids_peered

    def add_nexus(self, nexus, rendezvous_id):
        self.nexuses_by_uuid[nexus.uuid] = nexus
        self.rids_by_uuids[nexus.uuid] = rendezvous_id
        if rendezvous_id in self.unpeered_uuids_by_rid:
            peer_uuid = self.unpeered_uuids_by_rid[rendezvous_id]
            del self.unpeered_uuids_by_rid[rendezvous_id]
            self.uuid_peers[peer_uuid] = nexus.uuid
            self.uuid_peers[nexus.uuid] = peer_uuid
            self.rids_peered.add(rendezvous_id)
        else:
            self.unpeered_uuids_by_rid[rendezvous_id] = nexus.uuid

    def remove_nexus(self, nexus):
        if not self.is_nexus_in_directory(nexus):
            # peer socket closes can race leading to this getting called twice
            return
        assert nexus.uuid in self.nexuses_by_uuid, "removing nexus not added?"
        del self.nexuses_by_uuid[nexus.uuid]
        assert nexus.uuid in self.rids_by_uuids, "removing nexus not added?"
        rid = self.rids_by_uuids[nexus.uuid]
        del self.rids_by_uuids[nexus.uuid]
        if nexus.uuid in self.uuid_peers:
            peer_uuid = self.uuid_peers[nexus.uuid]
            del self.uuid_peers[peer_uuid]
            del self.uuid_peers[nexus.uuid]
            assert rid == self.rids_by_uuids[peer_uuid], "peer different rid?"
            self.unpeered_uuids_by_rid[rid] = peer_uuid
            self.rids_peered.remove(rid)
        else:
            assert rid in self.unpeered_uuids_by_rid, "removing unknown nexus?"
            assert nexus.uuid == self.unpeered_uuids_by_rid[rid]
            del self.unpeered_uuids_by_rid[rid]
