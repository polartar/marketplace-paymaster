# Simple Marketplace without gas fee
Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

## Install the project
   Clone this repo and run `npm install`
## How to compile the project?
  
  npx hardhat compile

## How to test the project?

  ### Test normal Marketplace features
    npx hardhat test test/marketplace.js
  ### Test GSN feature/gasless
    - Run gsn node for local environment
      `npm run gsn`
      
    - run `npx hardaht test test/MarketplaceGSN.js --network localhost`

## How to deploy the contracts?

  npx hardhat run scripts/sample-script.js --network [networkname]

## How to verify the contracts?
  
  npx hardhat verify [contract_address] --network [network name] [constructor parameters]