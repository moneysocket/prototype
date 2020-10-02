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

    def jsonrpc_ls(self, argv):
        return self.exec_cmd('ls', argv)

    def jsonrpc_connectsource(self, argv):
        return self.exec_cmd('connectsource', argv)

    def jsonrpc_disconnectsource(self, argv):
        return self.exec_cmd('disconnectsource', argv)

    def jsonrpc_rm(self, argv):
        return self.exec_cmd('rm', argv)


