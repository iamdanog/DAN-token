// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const DAN = await hre.ethers.getContractFactory("DAN");
  const dan = await DAN.deploy({ gasLimit: 5000000 });

  
  await dan.deployed();
  
  console.log("DAN deployed to:", dan.address);
  // After deploying the contract, add this line:
    console.log("Transaction hash:", dan.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });