// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

const Timestamp = require('../utl/timestamp.js').Timestamp;

class Rate {
    constructor(base_code, quote_code, rate_value, timestamp) {
        this.base_code = base_code;
        this.quote_code = quote_code;
        this.rate_value = rate_value;
        if (timestamp == null) {
            this.timestamp = Timestamp.getNowTimestamp();
        } else {
            this.timestamp = timestamp;
        }
    }

    toString() {
        return (this.rate_value.toFixed(8) + " " + this.base_code +
                this.quote_code + " " + this.timestamp);
    }

    convert(value, value_code) {
        if (value_code == this.base_code) {
            return [(value * this.rate_value), this.quote_code];
        } else if (value_code == this.quote_code) {
            return [(value / this.rate_value), this.base_code];
        } else {
            return [null, null];
        }
    }

    includes(code) {
        return ((code == this.base_code) || (code == this.quote_code));
    }

    other(code) {
        console.assert(this.includes(code));
        if (code == this.base_code) {
            return this.quote_code;
        } else {
            return this.base_code;
        }
    }

    invert() {
        return new Rate(this.quote_code, this.base_code,
                    1.0 / this.rate_value, this.timestamp);
    }
}


exports.Rate = Rate;
