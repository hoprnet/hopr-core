<!-- <font face="courier new" size="20" color="black">HOPR</font><font face="courier new" size="11" color="black">.network</font> -->

# HOPR

HOPR is a privacy-preserving messaging protocol that incentivizes users to participate in the network. It provides privacy by relaying messages via several relay nodes to the recipient. Relay nodes are getting paid via payment channels for their services.

### For further details, see the full [protocol specification on the wiki](../../wiki)

Note that the documentation is under active development and does not always represent the latest version of the protocol.

## Proof of Concept

The following is an early and unstable proof of concept that highlights the functionality of HOPR. Use it at your own risk. While we're giving our best to buidl a secure and privacy-preserving base layer of the web of today and tomorrow, we do not guaratee that your funds are safe and we do not guarantee that your communication is really metadata-private.

### Dependencies

The current implementation of HOPR is in JavaScript so you need:
- [`Node.js`](https://nodejs.org/en/download/) 11
- [`yarn`](https://yarnpkg.com/en/docs/install) >= 1.19.0

<!-- On Windows? 👀 here: [Windows Setup](../../wiki/Setup#Windows) -->

### Get HOPR!

Start by cloning this repository and let `yarn` install the dependencies:
```sh
git clone https://github.com/hoprnet/hopr-core.git
cd hopr-core
yarn install
```

### Project structure

For the time being, HOPR comes with a builtin chat client that is mostly used for demonstration purposes. It will not be part of HOPR in future releases.

```sh
.
├── db # will be generated at startup
├── migrations # contains Truffle migration scripts
├── src # the hopr src code
|   ├── ...
├── ...
├── hopr.js # contains the demo chat application
├── .env # configuration
└── config.js # parses the .env file
```

### Setup and configuration

For demonstration and testing purposes, `hopr` allows to run multiple instances of itself in the same folder. It will create individual database folders for each instance.

```
# normal usage
node hopr

# demo usage
node hopr <instance number, e. g. 0>
```

#### Demo accounts

In case you intend to use demo instances, make sure that you insert the private keys of these accounts into `.env.example`

```
DEMO_ACCOUNT_<number>_PRIVATE_KEY = <private key, e.g. 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef>
```

Also make sure that you insert the amount of demo accounts that you intend to use.

```
DEMO_ACCOUNTS = <number of demo accounts, e.g. 6>
```

If you need help when creating Ethereum accounts and/or equip them with Testnet Ether, follow these [instructions](../../wiki/Setup/#PrivateKeyGeneration). You also may want to use the [faucet](https://faucet.ropsten.be/) to receive some Ropsten testnet Ether and transfer them to funding account.

Please make sure that you have at least 0.15 (testnet) Ether on each of these accounts.

#### Ethereum RPC endpoint

In order to perform any on-chain interactions, you will need a connection to an Ethereum node. This can be a local Ganache testnet, a fully-fledged Ethereum node running on your computer or an Ethereum node that is run by a third party like Infura (note that this limits your privacy!).

#### Infura setup
1. Sign up for [`Infura and obtain your Project ID`](../../wiki/Setup/#Infura).
2. Insert the project id into `.env.example` :
```markdown
...
# Infura config
INFURA_PROJECT_ID = 0123456789abcdef0123456789abcbde
```

#### Ethereum network

HOPR supports multiple Ethereum networks, e.g. `mainnet` or `ropsten` testnet as well as `ganache`. Make sure that you change `NETWORK` in `env.example` according to the network you intend to use.

```
NETWORK = ganache
```

Also make sure that you have set a connection endpoint for that network.

```
PROVIDER_<YOUR NETWORK> = <url to the RPC endpoint, e.g. http://localhost:8545>
```

#### Bootstrap node

HOPR is supposed to be a decentralized network, so in order to bootstrap the network and tell recently joined nodes about the participants of the network, there needs to be a bootstrap node that is publicly known. Make sure that you set one or more bootstrap nodes in your `.env.example`.

```
BOOTSTRAP_NODES = <Multiaddr of your node, e.g. /ip4/142.93.163.250/tcp/9091/ipfs/16Uiu2HAm5xi9cMSE7rnW3wGtAbRR2oJDSJXbrzHYdgdJd7rNJtFf>
```

To start a bootstrap node, run `node hopr -b`

### Run HOPR!

Now that everything is set up you should be able to run HOPR via

```sh
mv .env.example .env

# normal usage
node hopr

# demo usage
node hopr <number>
```
