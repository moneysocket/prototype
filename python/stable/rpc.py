# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from txjsonrpc.web import jsonrpc
from stable.cmd_parse import StabledCmdParse

class StabledRpc(jsonrpc.JSONRPC):
    APP = None

    def exec_cmd(self, name, argv):
        parser = StabledCmdParse.get_parser(app=self.APP)
        parsed = parser.parse_args([name] + argv)
        # TODO - handle failed parse natively
        return parsed.cmd_func(parsed)

    def jsonrpc_getinfo(self, argv):
        return self.exec_cmd('getinfo', argv)

    def jsonrpc_connectasset(self, argv):
        return self.exec_cmd('connectasset', argv)

    def jsonrpc_disconnectasset(self, argv):
        return self.exec_cmd('disconnectasset', argv)

    def jsonrpc_create(self, argv):
        return self.exec_cmd('create', argv)

    def jsonrpc_createstable(self, argv):
        return self.exec_cmd('createstable', argv)

    def jsonrpc_connect(self, argv):
        return self.exec_cmd('connect', argv)

    def jsonrpc_listen(self, argv):
        return self.exec_cmd('listen', argv)

    def jsonrpc_clear(self, argv):
        return self.exec_cmd('clear', argv)

    def jsonrpc_rm(self, argv):
        return self.exec_cmd('rm', argv)

    def jsonrpc_createpegged(self, argv):
        return self.exec_cmd('createpegged', argv)

    def jsonrpc_rmpegged(self, argv):
        return self.exec_cmd('createpegged', argv)

