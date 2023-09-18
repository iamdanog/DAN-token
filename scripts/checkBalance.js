const { ethers } = require('hardhat');

async function main() {
    const accounts = await ethers.getSigners();
    const ethBalance = await ethers.provider.getBalance(accounts[0].address);
    console.log("ETH Balance:", ethers.utils.formatEther(ethBalance));

    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Mainnet WETH address

    const WETH = await ethers.getContractAt("IERC20", WETHAddress); // Use a basic ERC20 interface to query balance
    const wethBalance = await WETH.balanceOf(accounts[0].address);
    console.log("WETH Balance:", ethers.utils.formatEther(wethBalance));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

// The basic ERC20 interface for fetching balances
const IERC20 = [
    "function balanceOf(address account) view returns (uint256)"
];
