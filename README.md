Moneysocket
===========

Moneysocket is (WIP) protocol for socket-based coordination layer on top of the Lightning Network. The goal is to facilitate frictionless micropayments and provide a new paradigmn for flexible, easy-to-use wallets as well as embedded machine-to-machine payments.


project links @ [https://socket.money](https://socket.money)


### Running the example

In addition to the protocol, this repo contains a basic moneysocket example application. Specifically: an "*Opinion*" buying and selling app, complete with an interface for buyer, seller, a generic moneysocket wallet and beacon encoder/decoder.   

#### Prerequisites

To run the example, you will need: 

- [full Bitcoin node] (you cannot use a pruned version at this time)  
- lightning network service:  either [c-lightning] (recommended) or [LND] are supported  

#### Install moneysocket

In the case of c-lightning, moneysocket can be installed as a plugin: simply copy the contents of this repo to your **~/.lightning/plugins** directory... 

then delete all other .py files except for `terminus-lnd-app.py` 

```bash
git clone https://github.com/moneysocket/prototype.git; 
cd prototype; 
cp -r python ~/.lightning/plugins/moneysocket; 
cd ~/.lightning/plugins/moneysocket; 
rm relay-app.py reload-terminus-clp-app.py terminus-lnd-app.py test-protocol.py
```
(alternatively you may start c-lightning's `lightningd` service and then run `./python/reload-terminus-clp.app.py` which will copy over just the necessary files )

Next, install moneysocket's native dependencies `python3-crypto` and `libsecp256k1-dev`

For example, on Debian/Ubuntu you can run: 
```bash
apt-get install python3-crypto; 
apt-get install libsecp256k1-dev
```
and then its dependencies from Pip: 
```bash
pip install bech32 secp256k1 base58 bitstring pyln-client autobahn twisted pyOpenSSL
```

finally, make a copy of the terminus config file relevant to your lightning service and then placing it in the necessary directory. If using c-lightning for example, you can do: 
```
cp python/terminus/terminus-cl.conf ~/.lightning/bitcoin/moneysocket-terminus.conf
```

#### Install the example browser app

Follow the instructions to build/install the [browser] app included in this repo. 

#### Start bitcoind, lightningd, and the example browser app 

Start the two services above and the server for the example app.  Ie: 
```
bitcoind
lightningd --network=bitcoin --log-level=debug
cd browser; npm run quick-watch
```

#### Experiment
Open a browser and point to the app server you started, ie:  
 `http://localhost:8000`  

[TODO: add more explanation on how to use & tinker with the app ]

[browser]: ./browser
[full Bitcoin node]: https://bitcoin.org/en/full-node
[c-lightning]: https://github.com/ElementsProject/lightning
[LND]: https://github.com/lightningnetwork/lnd