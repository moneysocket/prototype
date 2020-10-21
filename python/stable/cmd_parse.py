# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import argparse

class StabledCmdParse():
    @staticmethod
    def get_parser(app=None):
        parser = argparse.ArgumentParser()

        subparsers = parser.add_subparsers(dest="subparser_name",
                                           title='commands',
                                           description='valid app commands',
                                           help='app commands')

        parser_getinfo = subparsers.add_parser('getinfo',
                                               help='output daemon status info')
        if app:
            parser_getinfo.set_defaults(cmd_func=app.getinfo)

        parser_connectasset = subparsers.add_parser("connectasset",
            help="connect to asset moneysocket provider")
        if app:
            parser_connectasset.set_defaults(cmd_func=app.connectasset)
        parser_connectasset.add_argument("beacon", help="asset beacon")

        parser_disconnectasset = subparsers.add_parser("disconnectasset")
        if app:
            parser_disconnectasset.set_defaults(cmd_func=app.disconnectasset)
        parser_disconnectasset.add_argument("provider_uuid",
                                             help="asset beacon")

        parser_create = subparsers.add_parser("createstable")
        parser_create.add_argument("amount", type=str,
                                   help="amount of monetary units")
        parser_create.add_argument("asset", type=str,
                                   help="asset code")
        if app:
            parser_create.set_defaults(cmd_func=app.createstable)

        parser_create = subparsers.add_parser("create")
        parser_create.add_argument("msatoshis", type=str,
            help="amount of btc, xxxsats ""is allowed for sats")
        if app:
            parser_create.set_defaults(cmd_func=app.create)


        parser_connect = subparsers.add_parser('connect',
                                               help='connect to websocket')
        parser_connect.add_argument("account", type=str,
                                    help="account for connection")
        parser_connect.add_argument("beacon", help="beacon to connect to")
        if app:
            parser_connect.set_defaults(cmd_func=app.connect)

        parser_listen = subparsers.add_parser('listen',
                                              help='set account to listen')
        parser_listen.add_argument("account", type=str,
            help="account to match with incoming connections")
        parser_listen.add_argument('-s', '--shared-seed', type=str,
            help="shared_seed to listen for account (default=auto-generated)")
        if app:
            parser_listen.set_defaults(cmd_func=app.listen)


        parser_clear = subparsers.add_parser('clear',
            help='clear connections for account')
        parser_clear.add_argument("account", type=str, help="account to clear")
        if app:
            parser_clear.set_defaults(cmd_func=app.clear)

        parser_rm = subparsers.add_parser("rm")
        parser_rm.add_argument("account", type=str,
                               help="account to remove")
        if app:
            parser_rm.set_defaults(cmd_func=app.rm)

        return parser
