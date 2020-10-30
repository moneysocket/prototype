# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import os
import json
import logging

from moneysocket.beacon.beacon import MoneysocketBeacon

PERSIST_FILENAME = "connect-persist.json"

EMPTY_DB = {"asset_beacons": [],
           }

class ConnectDb():
    def __init__(self, persist_dir):
        ConnectDb._make_dirs_exist(persist_dir)
        self.filename = os.path.join(persist_dir, PERSIST_FILENAME)
        logging.info("using: %s" % self.filename)
        self.make_exist(self.filename)
        self.db = self.read_json(self.filename)

    ###########################################################################

    @staticmethod
    def _make_dirs_exist(dir_path):
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

    ###########################################################################

    def make_exist(self, filename):
        if os.path.exists(filename):
            return
        logging.info("initializing new connect persit db: %s" % filename)
        dir_path = os.path.dirname(filename)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
        record = EMPTY_DB.copy()
        self.write_json(filename, record)

    def write_file(self, path, content):
        f = open(path, 'w')
        f.write(content)
        f.close()

    def write_json(self, path, info, quick=True):
        content = (json.dumps(info) if quick else
                   json.dumps(info, indent=1, sort_keys=True))
        self.write_file(path, content)

    def read_json(self, path):
        f = open(path, 'r')
        c = f.read()
        info = json.loads(c)
        f.close()
        return info

    def persist(self):
        self.write_json(self.filename, self.db)

    def depersist(self):
        os.remove(self.filename)

    ###########################################################################

    def add_beacon(self, beacon):
        beacon_str = beacon.to_bech32_str()
        if beacon_str not in self.db['asset_beacons']:
            self.db['asset_beacons'].append(beacon_str)
            self.persist()

    def remove_beacon(self, beacon):
        beacon_str = beacon.to_bech32_str()
        self.db['asset_beacons'].remove(beacon_str)
        self.persist()


    def get_asset_beacons(self):
        return [MoneysocketBeacon.from_bech32_str(b)[0] for b in
                self.db['asset_beacons']]

    def has_beacon(self, beacon):
        beacon_str = beacon.to_bech32_str()
        return beacon_str in self.db['asset_beacons']
