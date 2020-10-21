# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php
import time
import json

from hashlib import sha256

from binascii import hexlify, unhexlify

from moneysocket.utl.third_party.lightning_payencode.lnaddr import lndecode


MSATOSHIS_PER_BTC = 100000000000

class Bolt11(object):
    """ Parse a bolt 11 to a dictionary.
        WARNING: this is kind of primitive and doesn't properly parse all the           valid tags in
        https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md
    """

    @staticmethod
    def tags_by_name(name, tags):
        return [t[1] for t in tags if t[0] == name]

    @staticmethod
    def dump(bolt11):
        a = lndecode(bolt11)
        print(a.__dict__)
        print("Signed with public key:", hexlify(a.pubkey.serialize()))
        print("Currency:", a.currency)
        print("Payment hash:", hexlify(a.paymenthash))
        if a.amount:
            print("Amount:", a.amount)
        print("Timestamp: {} ({})".format(a.date, time.ctime(a.date)))
        for r in Bolt11.tags_by_name('r', a.tags):
            print("Route: ", end='')
            for step in r:
                print("{}/{}/{}/{}/{} ".format(hexlify(step[0]), hexlify(step[1]), step[2], step[3], step[4]), end='')
            print('')
        fallback = Bolt11.tags_by_name('f', a.tags)
        if fallback:
            print("Fallback:", fallback[0])
        description = Bolt11.tags_by_name('d', a.tags)
        if description:
            print("Description:", description[0])
        dhash = Bolt11.tags_by_name('h', a.tags)
        if dhash:
            print("Description hash:", hexlify(dhash[0]))
        expiry = Bolt11.tags_by_name('x', a.tags)
        if expiry:
            print("Expiry (seconds):", expiry[0])
        for t in [t for t in a.tags if t[0] not in 'rdfhx']:
            print("UNKNOWN TAG {}: {}".format(t[0], hexlify(t[1])))

    @staticmethod
    def iter_attributes(bolt11):
        a = lndecode(bolt11)
        yield "payee", a.pubkey.serialize().hex()
        yield "currency", a.currency
        yield "payment_hash", a.paymenthash.hex()
        if a.amount:
            msat = int(a.amount * MSATOSHIS_PER_BTC)
            yield "msatoshi", msat
            yield "amount_msat", "%dmsat" % msat

        yield "created_at", a.date

        description = Bolt11.tags_by_name('d', a.tags)
        if description:
            yield "description", description[0]
        else:
            yield "description", ""

        expiry = Bolt11.tags_by_name('x', a.tags)
        if expiry:
            yield "expiry", expiry[0]
        else:
            yield "expiry", 3600 # default if not specified

    @staticmethod
    def to_dict(bolt11):
        return {key: value for key, value in Bolt11.iter_attributes(bolt11)}

    @staticmethod
    def get_payment_hash(bolt11):
        for key, value in Bolt11.iter_attributes(bolt11):
            if key == "payment_hash":
                return value
        return None

    @staticmethod
    def get_msats(bolt11):
        for key, value in Bolt11.iter_attributes(bolt11):
            if key == "msatoshi":
                return value
        return None

    @staticmethod
    def preimage_to_payment_hash(preimage_str):
        preimage_bytes = bytes.fromhex(preimage_str)
        return sha256(preimage_bytes).hexdigest()
