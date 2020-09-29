# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import time


class Rate(dict):
    def __init__(self, base_code, quote_code, rate_value, timestamp=None):
        super().__init__()
        self['base_code'] = base_code
        self['quote_code'] = quote_code
        self['rate_value'] = rate_value
        self['timestamp'] = timestamp if timestamp else time.time()

    def __str__(self):
        return "%0.8f %s%s %s" % (self['rate_value'], self['base_code'],
                                  self['quote_code'], self['timestamp'])

    def convert(self, value, value_code):
        if value_code == self['base_code']:
            return (value * self['rate_value']), self['quote_code']
        elif value_code == self['quote_code']:
            return (value / self['rate_value']), self['base_code']
        else:
            return None, None

    def includes(self, code):
        return code in {self['base_code'], self['quote_code']}

    def other(self, code):
        #print(self)
        #print(code)
        assert self.includes(code)
        if code == self['base_code']:
            return self['quote_code']
        else:
            return self['base_code']

    def invert(self):
        return Rate(self['quote_code'], self['base_code'],
                    1.0 / self['rate_value'], timestamp=self['timestamp'])

    @staticmethod
    def derive(base_code, quote_code, rates):
        # TODO - some sort of graph-walking algorithm?

        assert len(rates) == 2
        #print("rates0: %s" % rates[0])
        #print("rates1: %s" % rates[1])

        assert rates[0].includes(base_code) or rates[1].includes(base_code)
        assert rates[0].includes(quote_code) or rates[1].includes(quote_code)

        if rates[0].includes(base_code):
            first = rates[0]
            second = rates[1]
        else:
            first = rates[1]
            second = rates[0]
        other_code = first.other(base_code)

        #print("first: %s" % first)
        #print("second: %s" % second)
        #print("other_code: %s" % other_code)
        assert second.includes(other_code)
        other_converted, other_check = first.convert(1.0, base_code)
        #print("other_converted: %s" % other_converted)
        #print("other_check: %s" % other_check)
        assert other_check == other_code
        quote_converted, quote_check = second.convert(other_converted,
                                                      other_code)
        assert quote_check == quote_code
        timestamp = min(first['timestamp'], second['timestamp'])
        return Rate(base_code, quote_code, quote_converted, timestamp=timestamp)
