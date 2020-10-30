# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from twisted.internet import reactor
from twisted.internet import threads
import krakenex

from moneysocket.wad.rate import Rate

FETCH_DELAY = 15.0

class Kraken():
    def fetch_btccad():
        try:
            k = krakenex.API()
            ticker = k.query_public('Ticker', {'pair': 'XXBTZCAD'})
            last_close_raw = ticker["result"]["XXBTZCAD"]["c"]
            last_close = last_close_raw[0]
            return float(last_close)
        except:
            return None

    def fetch_btcusd():
        try:
            k = krakenex.API()
            ticker = k.query_public('Ticker', {'pair': 'XXBTZUSD'})
            last_close_raw = ticker["result"]["XXBTZUSD"]["c"]
            last_close = last_close_raw[0]
            return float(last_close)
        except:
            return None

    def fetch_btceur():
        try:
            k = krakenex.API()
            ticker = k.query_public('Ticker', {'pair': 'XXBTZEUR'})
            last_close_raw = ticker["result"]["XXBTZEUR"]["c"]
            last_close = last_close_raw[0]
            return float(last_close)
        except:
            return None

    def fetch_btcgbp():
        try:
            k = krakenex.API()
            ticker = k.query_public('Ticker', {'pair': 'XXBTZGBP'})
            last_close_raw = ticker["result"]["XXBTZGBP"]["c"]
            last_close = last_close_raw[0]
            return float(last_close)
        except:
            return None


class RateUpdate():
    def __init__(self, app, rate_db):
        self.rate_db = rate_db
        assert "rate_change_cb" in dir(app)
        self.app = app

    def fetch_btccad_callback(self, btccad):
        if btccad:
            print("BTCCAD: %0.2f" % float(btccad))
            r = Rate("BTC", "CAD", btccad)
            self.rate_db.add_rate(r)
            self.app.rate_change_cb(r, "CAD")
            reactor.callLater(FETCH_DELAY, self.start_btccad)

    def start_btccad(self):
        d = threads.deferToThread(Kraken.fetch_btccad)
        d.addCallback(self.fetch_btccad_callback)

    def fetch_btcusd_callback(self, btcusd):
        if btcusd:
            print("BTCUSD: %0.2f" % float(btcusd))
            r = Rate("BTC", "USD", btcusd)
            self.rate_db.add_rate(r)
            self.app.rate_change_cb(r, "USD")
            reactor.callLater(FETCH_DELAY, self.start_btcusd)

    def start_btcusd(self):
        d = threads.deferToThread(Kraken.fetch_btcusd)
        d.addCallback(self.fetch_btcusd_callback)

    def fetch_btceur_callback(self, btceur):
        if btceur:
            print("BTCEUR: %0.2f" % float(btceur))
            r = Rate("BTC", "EUR", btceur)
            self.rate_db.add_rate(r)
            self.app.rate_change_cb(r, "EUR")
            reactor.callLater(FETCH_DELAY, self.start_btceur)

    def start_btceur(self):
        d = threads.deferToThread(Kraken.fetch_btceur)
        d.addCallback(self.fetch_btceur_callback)

    def fetch_btcgbp_callback(self, btcgbp):
        if btcgbp:
            print("BTCGBP: %0.2f" % float(btcgbp))
            r = Rate("BTC", "GBP", btcgbp)
            self.rate_db.add_rate(r)
            self.app.rate_change_cb(r, "GBP")
            reactor.callLater(FETCH_DELAY, self.start_btcgbp)

    def start_btcgbp(self):
        d = threads.deferToThread(Kraken.fetch_btcgbp)
        d.addCallback(self.fetch_btcgbp_callback)

    def run(self):
        reactor.callLater(2.0, self.start_btccad)
        reactor.callLater(2.0, self.start_btcusd)
        reactor.callLater(2.0, self.start_btceur)
        reactor.callLater(2.0, self.start_btcgbp)
