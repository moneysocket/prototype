# Copyright (c) 2020 Jarret Dyrbye
# Distributed under the MIT software license, see the accompanying
# file LICENSE or http://www.opensource.org/licenses/mit-license.php

import argparse

class TerminusCmdParse():
    @staticmethod
    def get_parser(app=None):
        parser = argparse.ArgumentParser()

        subparsers = parser.add_subparsers(dest="subparser_name",
                                           title='commands',
                                           description='valid app commands',
                                           help='app commands')

        parser_getinfo = subparsers.add_parser('getinfo',
                                               help='display summary')
        if app:
            parser_getinfo.set_defaults(cmd_func=app.getinfo)


        parser_create = subparsers.add_parser("create")
        parser_create.add_argument("msatoshis", type=str,
                                   help="spending amount in account")
        if app:
            parser_create.set_defaults(cmd_func=app.create)


        parser_rm = subparsers.add_parser("rm", help="remove account")
        parser_rm.add_argument("account", type=str,
                               help="account to remove")
        if app:
            parser_rm.set_defaults(cmd_func=app.rm)

        parser_connect = subparsers.add_parser('connect',
                                               help='connect to websocket')
        parser_connect.add_argument("account", type=str,
                                    help="account or service for connection")
        parser_connect.add_argument("beacon", help="beacon to connect to")
        if app:
            parser_connect.set_defaults(cmd_func=app.connect)


        parser_listen = subparsers.add_parser('listen',
                                              help='listen to websocket')
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

        return parser
