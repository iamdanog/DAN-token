require("@nomiclabs/hardhat-waffle");
require('hardhat-gas-reporter');


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  paths: {
    /* ... */
    '@uniswap/v2-periphery': 'node_modules/@uniswap/v2-periphery/contracts'
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8555",
      chainId: 31337
    },
    hardhat: {
      port: 8555,
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/cXj6i7j6Q9dIJ6scYCraqp5e8FVTEw-Z" 
      }
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.5.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }, 
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  loggingEnabled: true, 
  logger: {
    log: 'debug' 
  } 
};
