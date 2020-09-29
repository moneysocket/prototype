# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


from fiat import FIAT
from cryptocurrency import CRYPTOCURRENCY
from rate import Rate

BITCOIN_CODE = "BTC"

BTC = {"code":      "BTC",
       "countries": "All",
       "decimals":  0,
       "iso_num":   None,
       "name":      "Bitcoin",
       "symbol":    "₿"}


SATS_PER_BTC = 100000000.0
MSATS_PER_BTC = SATS_PER_BTC * 1000.0


class Wad(dict):
    def __init__(self, msats, asset_stable, asset_units, code,
                 countries=None, decimals=None, name=None, symbol=None):
        super().__init__()
        self['msats'] = msats
        self['asset_stable'] = asset_stable
        self['asset_units'] = asset_units
        self['code'] = code

        if not self['asset_stable']:
            self.update(BTC)
            self.asset_units = msats / MSATS_PER_BTC
        elif code in FIAT:
            assert not countries
            assert not decimals
            assert not name
            assert not symbol
            self.update(FIAT[code])
        elif code in CRYPTOCURRENCY:
            assert not countries
            assert not decimals
            assert not name
            assert not symbol
            self['contries'] = None
            self['decimals'] = 0
            self['name'] = CRYPTOCURRENCY[code]['name']
            self['symbol'] = ""
        else:
            self['countries'] = countries
            self['decimals'] = decimals
            self['name'] = name
            self['symbol'] = symbol

    def fmt_short(self):
        if not self['asset_stable']:
            return "%s %.3f sat" % (self['symbol'], self['msats'] / 1000.0)
        symb = ("%s " % self['symbol'] if
                (self['symbol'] and self['symbol'] != "") else "")
        if self['decimals'] is not None:
            afmt = "%." + str(self['decimals']) + "f"
            asset = afmt % self['asset_units']
        else:
            asset = "%d" % (round(self['asset_units']))
        return "%s%s %s" % (symb, asset, self['code'])

    def fmt_long(self):
        if not self['asset_stable']:
            return self.fmt_short()
        return "%s (%.3f sat)" % (self.fmt_short(), self['msats'] / 1000.0)


    @staticmethod
    def bitcoin(msats):
        return Wad(msats, False, msats, "BTC")

    @staticmethod
    def usd(usd, rate_btcusd):
        btc, code = rate_btcusd.convert(usd, "USD")
        assert code == "BTC"
        #print(code)
        #print(btc)
        msats = btc * MSATS_PER_BTC
        return Wad(msats, True, usd, "USD")

    @staticmethod
    def cad(cad, rate_btcad):
        btc, code = rate_btccad.convert(cad, "CAD")
        assert code == "BTC"
        #print("%s cad to btc: %s" % (cad, btc))
        msats = btc * MSATS_PER_BTC
        return Wad(msats, True, cad, "CAD")

    @staticmethod
    def custom(units, rate, code, countries, decimals, name, symbol):
        btc, btc_code = rate.convert(units, code)
        assert btc_code == "BTC"
        msats = btc * MSATS_PER_BTC
        return Wad(msats, True, units, code,
                   countries=countries, decimals=decimals, name=name,
                   symbol=symbol)


if __name__ == "__main__":
    EGGPLANT = "🍆"

    rate_ltcbtc = Rate("LTC", "BTC", 0.00420700)

    rate_btcusd = Rate("BTC", "USD", 10723.12)
    print("rate_btcusd: %s" % rate_btcusd)
    rate_usdbtc = rate_btcusd.invert()
    print("rate_usdbtc: %s" % rate_usdbtc)

    rate_btccad = Rate("BTC", "CAD", 14011.28)
    print("rate_btccad: %s" % rate_btccad)

    rate_cadbtc = rate_btccad.invert()
    print("rate_catbtc: %s" % rate_cadbtc)

    rate_eggplantcad = Rate("EGGPLANT", "CAD", 2.49)
    print("rate_eggplantcad: %s" % rate_eggplantcad)

    rate_cadeggplant = rate_eggplantcad.invert()
    print("rate_cadeggplant: %s" % rate_cadeggplant)

    rate_btceggplant = Rate.derive("BTC", "EGGPLANT",
                                   [rate_eggplantcad, rate_btccad])
    print("derived1: %s" % rate_btceggplant)

    rate_btceggplant = Rate.derive("BTC", "EGGPLANT",
                                   [rate_btccad, rate_eggplantcad])
    print("derived2: %s" % rate_btceggplant)

    rate_btceggplant = Rate.derive("BTC", "EGGPLANT",
                                   [rate_cadbtc, rate_eggplantcad])
    print("derived3: %s" % rate_btceggplant)

    rate_btceggplant = Rate.derive("BTC", "EGGPLANT",
                                   [rate_btccad, rate_cadeggplant])
    print("derived4: %s" % rate_btceggplant)

    rate_ltccad = Rate.derive("LTC", "CAD",
                              [rate_ltcbtc, rate_btccad])
    print("derived ltccad: %s" % rate_ltccad)

    b = Wad.bitcoin(1234)
    u = Wad.usd(12.99, rate_btcusd)
    c = Wad.cad(30, rate_btcusd)

    e = Wad.custom(3.14, rate_btceggplant, "EGGPLANT", "All", 3, "Eggplant",
                   EGGPLANT)


    print("------")

    import json

    #print(json.dumps(b))
    print(b.fmt_short())
    print(b.fmt_long())

  #print(json.dumps(u))
    print(u.fmt_short())
    print(u.fmt_long())


  #print(json.dumps(c))
    print(c.fmt_short())
    print(c.fmt_long())

  #print(json.dumps(e))
    print(e.fmt_short())
    print(e.fmt_long())
