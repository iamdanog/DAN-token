# DAN-token
Dan Token contract and testing these are the tests for the DAN token everything has passed. 

·---------------------------------------|---------------------------|-------------|-----------------------------·
|          Solc version: 0.5.0          ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
········································|···························|·············|······························
|  Methods                                                                                                      │
·············|··························|·············|·············|·············|···············|··············
|  Contract  ·  Method                  ·  Min        ·  Max        ·  Avg        ·  # calls      ·  eur (avg)  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  approve                 ·      26321  ·      46605  ·      39706  ·           20  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  decreaseAllowance       ·          -  ·          -  ·      29432  ·            1  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  increaseAllowance       ·          -  ·          -  ·      29375  ·            1  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  manualSwapTokensForETH  ·          -  ·          -  ·     160946  ·            1  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  setExemptStatus         ·          -  ·          -  ·      46370  ·            1  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  setMarketingReceiver    ·      29668  ·      52368  ·      48032  ·           36  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  transfer                ·      43071  ·      64971  ·      56557  ·           10  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  transferFrom            ·          -  ·          -  ·      61787  ·            1  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  withdrawDANToMarketing  ·          -  ·          -  ·      56057  ·            2  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  DAN       ·  withdrawETHToMarketing  ·          -  ·          -  ·      42093  ·            2  ·          -  │
·············|··························|·············|·············|·············|···············|··············
|  Deployments                          ·                                         ·  % of limit   ·             │
········································|·············|·············|·············|···············|··············
|  DAN                                  ·    4656856  ·    4656866  ·    4656859  ·       15.5 %  ·          -  │

We have made these files available to everyone if they want to learn how to test and write cotnracts. 
Also in the interestes of transparency. 

How to use the test files 


You will need to set up an Alchemy account https://www.alchemy.com/ and use the API to be able to fork Ethereum 
Set up your account then go to Apps then create new app Ethereum Mainnet grab the API key for https 

open hardhat.config.js and replace         url: "https://eth-mainnet.g.alchemy.com/v2/your-api" with your own api. 


to start the node with a specific netowork use >> npx hardhat node --hostname 127.0.0.1 --port 8555

New cmd window:>> npx hardhat test --network hardhat

open another and run the tests using 
    npx hardhat test --network hardhat



    Deployed on Goreli: >> 0x45a27ebad950a8724b2E28F66a14C4FfB48a01e3
                           0xA0d99074026a0c0550e606c4ba23cE01CE7D0EfF

    uint256 private _totalSupply = 9869690000000 * (10 ** _decimals);

    contract deployed to 0x276a0b591B10B911e398031c345B1714dFa5651b

    Verifying contract: 
    install npm install -g truffle-flattener

    open hardhat.config.js and alter if you need to for flatten 

    // Add the flatten task
task("flatten", "Flattens contract files")
  .setAction(async () => {
    try {
      execSync("truffle-flattener ./contracts/DAN.sol > ./DAN-flat.sol");
      console.log("Contracts successfully flattened");
    } catch (error) {
      console.error("Error flattening contracts: ", error);
    }
  });

  Then npx hardhat flatten
