// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php


const Crypto = require('crypto');
const b11 = require("bolt11");


const BinUtl = require("./bin.js").BinUtl;


class Bolt11 {

    static sha256(input_bytes) {
        const hash = Crypto.createHash('sha256');
        hash.update(input_bytes);
        return hash.digest();
    }

    static preimageToPaymentHash(preimage_str) {
        var preimage_bytes = BinUtl.h2b(preimage_str);
        var payment_hash_bytes = Bolt11.sha256(preimage_bytes);
        return BinUtl.b2h(payment_hash_bytes);
    }

    static getPaymentHash(bolt11) {
        var decoded = b11.decode(bolt11);
        //console.log("decoded b11: " + JSON.stringify(decoded));
        var tags = decoded.tags;

        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            if (tag.tagName == "payment_hash") {
                return tag.data;
            }
        }
        return null;
    }
}

exports.Bolt11 = Bolt11;
