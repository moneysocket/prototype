# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php


class StableDirectory(object):
    def __init__(self):
        self.account_by_shared_seed = {}
        self.shared_seeds_by_account = {}
        self.accounts = {}

        self.accounts_by_payment_hash = {}

    def iter_accounts(self):
        for account_name in sorted(self.accounts.keys()):
            yield self.accounts[account_name]

    def get_account_list(self):
        return list(self.iter_accounts())

    def get_account_name_set(self):
        return set(self.accounts.keys())

    def lookup_by_name(self, account_name):
        if account_name not in self.accounts.keys():
            return None
        return self.accounts[account_name]

    def lookup_by_seed(self, shared_seed):
        return self.account_by_shared_seed[shared_seed]

    def lookup_by_payment_hash(self, payment_hash):
        if payment_hash not in self.accounts_by_payment_hash:
            return set()
        return {self.accounts[name] for name in
                self.accounts_by_payment_hash[payment_hash]}

    def add_account(self, account):
        name = account.get_name()
        self.accounts[name] = account
        shared_seeds = account.get_all_shared_seeds()
        for shared_seed in shared_seeds:
            if name not in self.shared_seeds_by_account:
                self.shared_seeds_by_account[name] = set()
            self.shared_seeds_by_account[name].add(shared_seed)
            self.account_by_shared_seed[shared_seed] = account

        for payment_hash, _ in account.get_pending():
            if payment_hash not in self.accounts_by_payment_hash:
                self.accounts_by_payment_hash[payment_hash] = set()
            self.accounts_by_payment_hash[payment_hash].add(name)

    def reindex_account(self, account):
        self.add_account(account)

    def remove_account(self, account):
        name = account.get_name()
        _ = self.accounts.pop(name)
        shared_seeds = self.shared_seeds_by_account.pop(name, set())
        for shared_seed in shared_seeds:
            _ = self.account_by_shared_seed[shared_seed]

        for payment_hash, _ in account.get_pending():
            self.accounts_by_payment_hash[payment_hash].remove(name)
