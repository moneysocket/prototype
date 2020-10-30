# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


from moneysocket.wad.fiat import FIAT
from moneysocket.wad.cryptocurrency import CRYPTOCURRENCY
from moneysocket.wad.rate import Rate

BTC = {"code":      "BTC",
       "countries": "All",
       "decimals":  0,
       "iso_num":   None,
       "name":      "Bitcoin",
       "symbol":    "₿"}


MSAT_PER_SAT = 1000.0
SATS_PER_BTC = 100000000.0
MSATS_PER_BTC = SATS_PER_BTC * MSAT_PER_SAT


class Wad(dict):
    def __init__(self, msats, asset_stable, asset_units, code,
                 countries=None, decimals=None, name=None, symbol=None):
        super().__init__()
        assert msats >= 0, "must be positive msat value"
        self['msats'] = msats
        self['asset_stable'] = asset_stable
        self['asset_units'] = asset_units
        self['code'] = code

        if not self['asset_stable']:
            self.update(BTC)
            self.asset_units = msats / MSATS_PER_BTC
        elif code in FIAT:
            #assert not countries
            #assert not decimals
            #assert not name
            #assert not symbol
            self.update(FIAT[code])
        elif code in CRYPTOCURRENCY:
            assert not countries
            assert not decimals
            assert not name
            assert not symbol
            self['contries'] = None
            self['decimals'] = 0
            self['iso_num'] = None
            self['name'] = CRYPTOCURRENCY[code]['name']
            self['symbol'] = ""
        else:
            self['countries'] = countries
            self['decimals'] = decimals
            self['iso_num'] = None
            self['name'] = name
            self['symbol'] = symbol

    ###########################################################################

    def __str__(self):
        return self.fmt_short()

    def fmt_short(self):
        if not self['asset_stable']:
            return "%s %.3f sat" % (self['symbol'],
                                    self['msats'] / MSAT_PER_SAT)
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
        return "%s (%.3f sat)" % (self.fmt_short(),
                                  self['msats'] / MSAT_PER_SAT)

    ###########################################################################

    def getDefactoRate(self):
        if self['msats'] == 0:
            return None
        if not self['asset_stable']:
            return Rate('BTC', 'BTC', 1.0)
        b = self['msats'] / MSATS_PER_BTC
        r = self['asset_units'] / b
        rate = Rate('BTC', self['code'], r)
        return rate

    def clone(self):
        return Wad(self['msats'], self['asset_stable'], self['asset_units'],
                   self['code'], self['countries'], self['decimals'],
                   self['name'], self['symbol'])


    def clone_msats(self, new_msats):
        rate = self.getDefactoRate()
        if rate == None:
            c = Wad.clone(self)
            c['msats'] = 0
            c['asset_units'] = 0
            return c
        new_btc = new_msats / MSATS_PER_BTC;
        other = rate.other('BTC')
        new_units, code = rate.convert(new_btc, 'BTC')
        return Wad(new_msats, self['asset_stable'], new_units,
                   self['code'], self['countries'], self['decimals'],
                   self['name'], self['symbol'])

    def adjust_msats_to_rate(self, rate):
        assert rate['base_code'] == "BTC"
        assert self['asset_stable']
        btc, code = rate.convert(self['asset_units'], self['code'])
        assert code == "BTC"
        self['msats'] = round(btc * MSATS_PER_BTC)

    ###########################################################################

    @staticmethod
    def validate_wad_dict(wad_dict):
        if type(wad_dict) != dict:
            return "is not a dictionary"
        if set(wad_dict.keys()) != {'msats', 'asset_stable', 'asset_units',
                                    'code', 'countries', 'decimals',
                                   'iso_num', 'name', 'symbol'}:
            return "key set not consistent with wad dictionary"
        if type(wad_dict['msats']) != int:
            return "msats valie not iteger"
        if wad_dict['msats'] < 0:
            return "msats value negative"
        if type(wad_dict['asset_stable']) != bool:
            return "asset_stable not bool"
        if type(wad_dict['asset_units']) not in {float, int}:
            return "asset_units not float"
        if wad_dict['asset_units'] < 0:
            return "asset_units value negative"
        if type(wad_dict['code']) != str:
            return "code not string"
        if len(wad_dict['code']) > 20:
            return "code string too long"
        if wad_dict['countries'] is not None:
            if type(wad_dict['countries']) != str:
                return "countries not string"
            if len(wad_dict['countries']) > 200:
                return "countries string too long"
        if wad_dict['decimals'] is not None:
            if type(wad_dict['decimals']) != int:
                return "decimals not int"
            if wad_dict['decimals'] < 0:
                return "decimals negative value"
            if wad_dict['decimals'] > 10:
                return "decimals more than 10?"
        if wad_dict['name'] is not None:
            if type(wad_dict['name']) != str:
                return "name not string"
            if len(wad_dict['name']) > 50:
                return "name string too long"
        if wad_dict['symbol'] is not None:
            if type(wad_dict['symbol']) != str:
                return "symbol not string"
            if len(wad_dict['symbol']) > 5:
                return "symbol string too long"
        return None

    @staticmethod
    def from_dict(wad_dict):
        if wad_dict is None:
            return Wad.bitcoin(0)
        return Wad(wad_dict['msats'], wad_dict['asset_stable'],
                   wad_dict['asset_units'], wad_dict['code'],
                   countries=wad_dict['countries'],
                   decimals=wad_dict['decimals'], name=wad_dict['name'],
                   symbol=wad_dict['symbol'])

    @staticmethod
    def bitcoin_from_msat_string(msat_string):
        if msat_string.endswith("msat"):
            try:
                msats = int(msat_string[:-4])
            except:
                return None, "could not parse msat value"
        elif msat_string.endswith("msats"):
            try:
                msats = int(msat_string[:-5])
            except:
                return None, "could not parse msat value"
        elif msat_string.endswith("sat"):
            try:
                msats = 1000 * int(msat_string[:-3])
            except:
                return None, "could not parse msat value"
        elif msat_string.endswith("sats"):
            try:
                msats = 1000 * int(msat_string[:-4])
            except:
                return None, "could not parse msat value"
        else:
            try:
                msats = 1000 * int(msat_string)
            except:
                return None, "could not parse msat value"
        if msats <= 0:
            return None, "invalid msatoshis value"
        return Wad.bitcoin(msats), None


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
    def cad(cad, rate_btccad):
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
