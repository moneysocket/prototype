# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

from txjsonrpc.web import jsonrpc
from terminus.cmd_parse import TerminusCmdParse

class TerminusRpc(jsonrpc.JSONRPC):
    APP = None

    def exec_cmd(self, name, argv):
        parser = TerminusCmdParse.get_parser(app=self.APP)
        parsed = parser.parse_args([name] + argv)
        # TODO - handle failed parse natively
        return parsed.cmd_func(parsed)

    def jsonrpc_ls(self, argv):
        return self.exec_cmd('ls', argv)

    def jsonrpc_create(self, argv):
        return self.exec_cmd('create', argv)

    def jsonrpc_rm(self, argv):
        return self.exec_cmd('rm', argv)

    def jsonrpc_connect(self, argv):
        return self.exec_cmd('connect', argv)

    def jsonrpc_listen(self, argv):
        return self.exec_cmd('listen', argv)

    def jsonrpc_clear(self, argv):
        return self.exec_cmd('clear', argv)
