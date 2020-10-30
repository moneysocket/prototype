// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Rate = require("./rate.js").Rate;

const FIAT = require("./fiat.js").FIAT;
const CRYPTOCURRENCY = require("./cryptocurrency.js").CRYPTOCURRENCY;


const BTC = {"code":      "BTC",
             "countries": "All",
             "decimals":  0,
             "iso_num":   null,
             "name":      "Bitcoin",
             "symbol":    "₿"};


const MSATS_PER_SAT = 1000.0;
const SATS_PER_BTC = 100000000.0;
const MSATS_PER_BTC = SATS_PER_BTC * MSATS_PER_SAT;

const WAD_KEYS = new Set(['msats', 'asset_stable', 'asset_units', 'code',
                          'countries', 'decimals', 'iso_num', 'name',
                          'symbol']);

class Wad {
    constructor(msats, asset_stable, asset_units, code, countries, decimals,
                name, symbol)
    {
        console.assert(msats != null);
        console.assert(asset_stable != null);
        console.assert(asset_units != null);
        console.assert(code != null);
        // the rest can be null

        console.assert(msats >= 0, "must be positive msat value");

        this.msats = msats;
        this.asset_stable = asset_stable;
        this.asset_units = asset_units;
        this.code = code;

        if (! this.asset_stable) {
            this.code = BTC['code'];
            this.countries = BTC['countries'];
            this.decimals = BTC['decimals'];
            this.iso_num = BTC['iso_num'];
            this.name = BTC['name'];
            this.symbol = BTC['symbol'];
        } else if (code in FIAT) {
            //console.assert(countries == null);
            //console.assert(decimals == null);
            //console.assert(name == null);
            //console.assert(symbol == null);

            this.countries = FIAT[code]['countries'];
            this.decimals = FIAT[code]['decimals'];
            this.iso_num = FIAT[code]['iso_num'];
            this.name = FIAT[code]['name'];
            this.symbol = FIAT[code]['symbol'];

        } else if (code in CRYPTOCURRENCY) {
            console.assert(countries == null);
            console.assert(decimals == null);
            console.assert(name == null);
            console.assert(symbol == null);

            this.countries = null;
            this.decimals = 0;
            this.iso_num = null;
            this.name = CRYPTOCURRENCY[code]['name'];
            this.symbol = "";
        } else {
            this.countries = countries;
            this.decimals = decimals;
            this.iso_num = null;
            this.name = name;
            this.symbol = symbol;
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    toString() {
        return this.fmtShort();
    }

    fmtShort() {
        if (! this.asset_stable) {
            return (this.symbol + " " +
                    (this.msats / MSATS_PER_SAT).toFixed(3) + " sats");
        }
        var symb = "";
        if ((this.symbol != null) && (this.symbol != "")) {
            symb = this.symbol + " ";
        }
        var dec = 0;
        if (this.decimals != null) {
            dec = this.decimals;
        }
        var asset = this.asset_units.toFixed(this.decimals);
        return symb + asset + " " + this.code;
    }

    fmtLong() {
        if (! this.asset_stable) {
            return this.fmtShort();
        }
        return (this.fmtShort() + " {" +
                (this.msats / MSATS_PER_SAT).toFixed(3) + " sat)");
    }

    ///////////////////////////////////////////////////////////////////////////

    getDefactoRate() {
        if (this.msats == 0) {
            return null;
        }
        if (! this.asset_stable) {
            return new Rate('BTC', 'BTC', 1.0, null);
        }
        var b = (this.msats / MSATS_PER_BTC);
        var r = this.asset_units / b;
        var rate = new Rate('BTC', this.code, r, null);
        return rate;
    }

    ///////////////////////////////////////////////////////////////////////////

    static clone(wad) {
        return new Wad(wad['msats'], wad['asset_stable'], wad['asset_units'],
                       wad['code'], wad['countries'], wad['decimals'],
                       wad['name'], wad['symbol'])
    }

    static clone_msats(wad, new_msats) {
        var rate = wad.getDefactoRate();
        console.log("rate: " + rate.toString());
        console.log("new_msats " + new_msats);
        if (rate == null) {
            var c = Wad.clone(wad);
            c['msats'] = 0;
            c['asset_units'] = 0;
            return c;
        }
        var new_btc = new_msats / MSATS_PER_BTC;
        var other = rate.other('BTC');
        console.log("other " + other);
        console.log("new btc " + new_btc);
        var [new_units, code] = rate.convert(new_btc, 'BTC');
        console.assert(other == code);
        console.log("new_units " + new_units);
        console.log("code " + code);
        return new Wad(new_msats, wad['asset_stable'], new_units,
                       wad['code'], wad['countries'], wad['decimals'],
                       wad['name'], wad['symbol'])
    }

    ///////////////////////////////////////////////////////////////////////////

    static validate_wad_dict(wad_dict) {
        if (typeof wad_dict != 'object') {
            return "is not a dictionary";
        }

        if (Object.keys(wad_dict).length != WAD_KEYS.size) {
            return "key mismatch";
        }
        //console.log(WAD_KEYS);
        for (var key in wad_dict) {
           ///console.log("key: " + key);
            if (! (WAD_KEYS.has(key))) {
                return "key set not consistent with wad dictionary";
            }
        }
        if (typeof wad_dict['msats'] != 'number') {
            return 'msats not a value';
        }
        if (wad_dict['msats'] < 0) {
            return "msats must be a non-negative value";
        }
        if (typeof wad_dict['asset_stable'] != 'boolean') {
            return "asset_stable must be a boolean";
        }
        if (typeof wad_dict['asset_units'] != 'number') {
            return 'asset_units not a value';
        }
        if (wad_dict['asset_units'] < 0) {
            return "asset_units must be a positive value";
        }
        if (typeof wad_dict['code'] != 'string') {
            return "unknown code type";
        }
        if (wad_dict['code'].length > 20) {
            return "code string too long";
        }
        if (wad_dict['countries'] != null) {
            if (typeof wad_dict['countries'] != 'string') {
                return "countries not string";
            }
            if (wad_dict['countries'].length > 1000) {
                return "countries string too long";
            }
        }
        if (wad_dict['decimals'] != null) {
            if (typeof wad_dict['decimals'] != 'number') {
                return "decimals value not a number";
            }
            if (wad_dict['decimals'] < 0) {
                return "decimals negative value";
            }
            if (wad_dict['decimals'] > 10) {
                return "decimals more than 10?";
            }
        }
        if (wad_dict['name'] != null) {
            if (typeof wad_dict['name'] != 'string') {
                return "name not string";
            }
            if (wad_dict['name'].length > 50) {
                return "name string too long";
            }
        }
        if (wad_dict['symbol'] != null) {
            if (typeof wad_dict['symbol'] != 'string') {
                return "symbol not string";
            }
            if (wad_dict['symbol'].length > 5) {
                return "symbol string too long";
            }
        }
        return null;
    }

    static fromDict(wad_dict) {
        if (wad_dict == null) {
            return new Wad.bitcoin(0);
        }
        return new Wad(wad_dict['msats'], wad_dict['asset_stable'],
                       wad_dict['asset_units'], wad_dict['code'],
                       wad_dict['countries'], wad_dict['decimals'],
                       wad_dict['name'], wad_dict['symbol'])
    }

    ///////////////////////////////////////////////////////////////////////////

    static bitcoin(msats) {
        return new Wad(msats, false, msats, "BTC");
    }

    static usd(usd, rate_btcusd) {
        var [btc, code] = rate_btcusd.convert(usd, "USD");
        console.assert(code == "BTC");
        var msats = btc * MSATS_PER_BTC;
        return new Wad(msats, true, usd, "USD")
    }

    static cad(cad, rate_btccad) {
        var [btc, code] = rate_btccad.convert(cad, "CAD");
        console.assert(code == "BTC");
        var msats = btc * MSATS_PER_BTC;
        return new Wad(msats, true, usd, "CAD");
    }

    static custom(units, rate, code, countries, decimals, name, symbol) {
        var [btc, btc_code] = rate.convert(units, code);
        console.assert(btc_code == "BTC");
        var msats = btc * MSATS_PER_BTC;
        return new Wad(msats, true, units, code, countries, decimals, name,
                       symbol);
    }
}



exports.Wad = Wad;
