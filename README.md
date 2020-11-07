Moneysocket
===========

Moneysocket is (WIP) protocol for socket-based coordination layer on top of the Lightning Network. The goal is to facilitate frictionless micropayments and provide a new paradigm for flexible, easy-to-use wallets as well as embedded machine-to-machine payments.


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

If the moneysocket plugin was installed correctly, you should see it in your lightningd debug output as `... DEBUG   plugin-manager: started ... ./lightning/plugins/moneysocket/terminus-clp-app.py

##### * Optional, second Lightning instance *

The complete demo showcases two independent lightning nodes: one for buyer and the other for seller.   In the case of c-lightning, each node would have its own instance of the  moneysocket plugin installed. 

For testing, you may want to re-create this setup using just one machine - you can so by duplicating your existing .lightning directory (and thus, the moneysocket plugin within) ie: 

```
cp -rf  ~/.lightning .lightning2
```

edit the lightning config to announce on a different port: 
```
cd ./lightning2
echo 'announce-addr=127.0.0.1:9736` >> config
```
then edit the moneysocket-terminus.conf previously copied in the install step above to change `AccountPersistDir` to a new directory as well as a different `BindPort` and `ExternalPort` for both [Listen] and [Rpc] sections ie: 
```
# ./lightning2/bitcoin/moneysocket-terminus.conf
[App]
AccountPersistDir = ./moneysocket-terminus-persist2/
[Listen]
...
BindPort = 11034
ExternalPort = 11034
...
[Rpc]
...
BindPort = 11055
ExternalPort = 11055
```

#### run the moneysocket terminus CLI

The moneysocket terminus CLI is an interface to moneysocket's core functionality.  With your lightning node started and plugin installed, you can run the terminus app contained in this repo ie: 

```bash
#from the directory you cloned this repo
cd python; 
./terminus-cli getinfo
```

The terminus handles moneysockets in context of 'accounts'.  The accounts serve as an abstract container of funds (reserved from your available Lightning balance) that you can use to manage your moneysockets for different purposes or vendors, for example.   

To get started create an account with the following command indicating how many mSatoshis you want to allocate for it: 

```bash
./terminus-cli create 3333 #< number of satoshis you want to allocate
```

Now, create a `beacon` that you can share it upstream, in the case of this demo - to the "Seller app". 

If you have a second node with moneysocket installed, run the terminus-cli again on it to create an account (ie- with 4444 satoshis) and the listen to generate another beacon.  For the demo, we use this second node as the "buyer" and thus its beacon to connect the buyer's Lightning node to their hypothetical Web Wallet. 

Note, if your second Lightning node is on the same machine you will need to edit the `./python/terminus-cli` file line 16 to indicate the path to your second lightning node ie: 

```python
CONFIG_FILE = os.path.join(os.path.expanduser("~"),
                           ".lightning2/bitcoin/moneysocket-terminus.conf")
```


#### Buy & sell over moneysocket
Open a browser and point to the app server you started, ie:  
 `http://localhost:8000`  

Open a tab or window for the Seller app, Buyer app, and Web Wallet. 

![][screenshot]


The Seller app is an interface of what a 'shop keeper' might see as they make products availalbe for customers to buy, as well as to reflect their updated Lightning node balance as it changes as customers make purchases. 

In the Seller app, on the left side - paste the beacon you generated from the previous step (output from the command: `./terminus-cli listen account-0`) into the **Input Beacon** field then click Connect.   

If successful, the app will reflect the live balance of the moneysocket account you just connected. 

You have successfully established a 2 way moneysocket connection!  This represents the seller's connection from his/her Lightning node to the 'app' where the app can be any web or mobile app that has integrated support for moneysocket. 

Next, to simulate a 'buyer' setup another beacon between your (second) Lightning node and 'Buyer app' - the Buyer app of which is the interface a buyer would see as they shop on the Seller's store.  Yet instead of connecting the Buyer app directly to the buyer's Lightning node, let's add a middle layer between them so our buyer can gain more control over how much funds the Buyer app can have access to. 

Open the Web Wallet app linked from `http://localhost:8000` and copy/paste the beacon you generated earlier with the terminus-cli (the second beacon you created; ie- on your second node since the original node represents the buyer).  Paste it into the rightmost side's **Input Beacon** field.   Click connect. 

Next, open the "Buyer App".   This time, we will generate a beacon on the clientside so simply click on **Generate Beacon** and 'Connect' (using the rightside Input Beacon field).  Notice we generated and connected to the beacon all within the same app - the beacon is agnostic to where it originates.   

Now back to the Web Wallet app copy/paste the beacon we just generated in side the Buyer App into the remaining open Input field.

![][screenshotGIF]

If all goes well, you've just connected the Buyer App to your Web Wallet which is in turn connected to your Lightning node.   On the Web Wallet you may drag the slider to see the available spending balance reflect in realtime on the Buyer App.    This demonstrates how easy it is to accommodate for customer driven spending control. 

It is analogous to putting a credit card in a shopping app but instead of your entire credit limit exposed as a result, you have the power to control in realtime how much credit could ever be spent with that vendor. 

Furthermore - you could connect or layer-in any number of other upstream connections for example if you wanted to divert funds, monitor activity, or perform some custom functionality or logic at key stages of each transaction.  If Bitcoin is 'programmable money', then moneysocket is a programmable *stream* of money. 

Finally, connect the Buyer and Seller apps so that we may proceed with a test transaction to actually buy something.   Simply create another beacon - you can do this on the Seller or Buyer app - click Generate/Copy beacon on for example the Buyer app and then paste into the remaining open Input Beacon field on the Seller app's left side.

Lastly, from the Seller app click **Open Store**  
And try to purchase a product using your Buyer app. 

*Video demonstration/overview*  
https://youtu.be/nBHha3HRV20


[browser]: ./browser
[full Bitcoin node]: https://bitcoin.org/en/full-node
[c-lightning]: https://github.com/ElementsProject/lightning
[LND]: https://github.com/lightningnetwork/lnd
[screenshot]: ./screenshot.png 
[screenshotGIF]: ./screenshot.gif 
