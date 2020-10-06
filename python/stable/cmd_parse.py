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

        parser_connectsource = subparsers.add_parser("connectsource")
        if app:
            parser_connectsource.set_defaults(cmd_func=app.connectsource)
        parser_connectsource.add_argument("beacon", help="source beacon")

        parser_disconnectsource = subparsers.add_parser("disconnectsource")
        if app:
            parser_disconnectsource.set_defaults(cmd_func=app.disconnectsource)
        parser_disconnectsource.add_argument("provider_uuid",
                                             help="source beacon")
        return parser
