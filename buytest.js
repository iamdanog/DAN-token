const { expect } = require('chai');
const { ethers } = require('hardhat');


let DAN;
let WETH;
let uniswapFactory;
let uniswapRouter;
let lpTokenAddress;
let lpToken; 
let owner;
let feeAddress;
let addr2;
let addr3;
let addr4;
let addrs;
let marketingWallet;
let danBalance;
let wethBalance;
let addr3Balance;
let tokenDecimals;


const WETH9_ABI = require("@uniswap/v2-periphery/build/WETH9.json").abi;
const UniswapV2Factory_ABI = require("@uniswap/v2-core/build/UniswapV2Factory.json").abi;
const UniswapV2Router02_ABI = require("@uniswap/v2-periphery/build/UniswapV2Router02.json").abi;
const IUniswapV2Pair_ABI = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json").abi;





const network = {
  name: 'localhost',
  chainId: 31337,
};

describe("DAN Token Buy/Sell Test", function () {
 

  beforeEach(async function () {
    // Deploy DAN token contract
    [owner, marketingWallet, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

    const DANContract = await ethers.getContractFactory("DAN");
    DAN = await DANContract.deploy();
    console.log("DAN contract deployed to:", DAN.address);
  
  
    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    WETH = await ethers.getContractAt(WETH9_ABI, WETHAddress);
  
    await WETH.deposit({value: ethers.utils.parseEther("10")});
  
    const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    uniswapFactory = await ethers.getContractAt(UniswapV2Factory_ABI, factoryAddress); 
  
    const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    uniswapRouter = await ethers.getContractAt(UniswapV2Router02_ABI, routerAddress);
  
  // Check for existing liquidity pair
  lpTokenAddress = await uniswapFactory.getPair(DAN.address, WETH.address);
  
  // If the liquidity pair doesn't exist, create it
  if (lpTokenAddress === '0x0000000000000000000000000000000000000000') {
    await uniswapFactory.createPair(DAN.address, WETH.address);
    lpTokenAddress = await uniswapFactory.getPair(DAN.address, WETH.address);
  }
  
  
  // Get the contract instance for the liquidity pair
  lpToken = await ethers.getContractAt(IUniswapV2Pair_ABI, lpTokenAddress);
  
  
  
    await DAN.setMarketingReceiver(marketingWallet.address);
  
    DAN.on('DebugAllowance', (routerAllowance) => {
      console.log("Should be the debug stuff "+routerAllowance.toString());
    });
  
  
  
    danBalance = await DAN.balanceOf(owner.address);
    wethBalance = await WETH.balanceOf(owner.address);
    addr3Balance = await DAN.balanceOf(addr3.address);



  });

  it("Should allow buying tokens", async function () {

      // Add liquidity to the DAN/ETH Uniswap pair
  await addLiquidity();
    // Approve tokens for spending
    await DAN.connect(owner).approve(uniswapRouter.address, ethers.utils.parseEther("1"));

    // Swap ETH for tokens
    const amountIn = ethers.utils.parseEther("0.1"); // Amount of ETH to spend
    await uniswapRouter.connect(owner).swapETHForExactTokens(
      ethers.utils.parseEther("100"), // Amount of tokens to receive
      [DAN.address, uniswapRouter.WETH()],
      owner.address,
      (await ethers.provider.getBlock("latest")).timestamp + 1000,
      { value: amountIn }
    );

    // Check balances
    expect(await DAN.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100"));
  });

  it("Should allow selling tokens", async function () {
      // Add liquidity to the DAN/ETH Uniswap pair
  await addLiquidity();
    // Transfer some tokens to addr2
    await DAN.transfer(addr2.address, ethers.utils.parseEther("100"));

    // Approve tokens for spending
    await DAN.connect(addr2).approve(uniswapRouter.address, ethers.utils.parseEther("100"));

    // Swap tokens for ETH
    const amountOutMin = ethers.utils.parseEther("0.09"); // Minimum ETH to receive
    await uniswapRouter.connect(addr2).swapExactTokensForETH(
      ethers.utils.parseEther("100"),
      amountOutMin,
      [DAN.address, uniswapRouter.WETH()],
      addr2.address,
      (await ethers.provider.getBlock("latest")).timestamp + 1000
    );

    // Check balances
    expect(await DAN.balanceOf(addr2.address)).to.equal(0);
  });

  async function addLiquidity() {
    // Add 1000 DAN tokens and 1 ETH as liquidity
    const amountTokenDesired = ethers.utils.parseEther("1000");
    const amountETHDesired = ethers.utils.parseEther("1");
  
    // Approve DAN tokens for spending
    await DAN.connect(owner).approve(uniswapRouter.address, amountTokenDesired);
  
    // Add liquidity to the DAN/ETH pool
    await uniswapRouter.connect(owner).addLiquidityETH(
      DAN.address, 
      amountTokenDesired,
      0, // slippage is unavoidable 
      0, // slippage is unavoidable
      owner.address,
      (await ethers.provider.getBlock("latest")).timestamp + 1000,
      { value: amountETHDesired }  
    );
  }
  

});
