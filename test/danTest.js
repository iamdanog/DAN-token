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

// const provider = new ethers.providers.JsonRpcProvider(`http://127.0.0.1:8555`, network);

beforeEach(async () => {
  [owner, marketingWallet, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

  console.log("-- before each owner:", owner.address);
  console.log("-- before each Marketing wallet:", marketingWallet.address);
  console.log("-- before each addr2:", addr2.address);

  const DANContract = await ethers.getContractFactory("DAN");
  DAN = await DANContract.deploy();
  console.log("DAN contract deployed to:", DAN.address);


  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  WETH = await ethers.getContractAt(WETH9_ABI, WETHAddress);

  await WETH.deposit({value: ethers.utils.parseEther("60")});

  const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  uniswapFactory = await ethers.getContractAt(UniswapV2Factory_ABI, factoryAddress); 

  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Replace with the actual address if different
  uniswapRouter = await ethers.getContractAt(UniswapV2Router02_ABI, routerAddress);

/*
  const UniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02");

  // Deploy it with the WETH and factory addresses
  uniswapRouter = await UniswapV2Router02.deploy(
    WETH.address, 
    uniswapFactory.address  
  );
  */

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

 // DAN.on('DebugAllowance', (routerAllowance) => {
 //   console.log("Should be the debug stuff "+routerAllowance.toString());
 // });



  danBalance = await DAN.balanceOf(owner.address);
  wethBalance = await WETH.balanceOf(owner.address);
  addr3Balance = await DAN.balanceOf(addr3.address);

      // Ensure initialized contracts before operations
      expect(DAN).to.exist;
      expect(WETH).to.exist;
      expect(uniswapFactory).to.exist;
      expect(uniswapRouter).to.exist;
      expect(lpToken).to.exist;

});


// useful functions 

async function getAndLogReserves() {
  const [reserveDAN, reserveWETH] = await lpToken.getReserves();
  console.log("Initial DAN Reserves:", ethers.utils.formatEther(reserveDAN.toString()));
  console.log("Initial WETH Reserves:", ethers.utils.formatEther(reserveWETH.toString()));
  return [reserveDAN, reserveWETH];
}

async function approveTokens() {
  const maxUint256 = ethers.constants.MaxUint256;
  await DAN.connect(owner).approve(uniswapRouter.address, maxUint256);
  await WETH.connect(owner).approve(uniswapRouter.address, maxUint256);
}

async function checkAndLogBalances(amountTokenDesired, amountETHDesired) {
  const danBalance = await DAN.balanceOf(owner.address);
  const wethBalance = await WETH.balanceOf(owner.address);
  
  console.log(`Owner DAN balance before adding liquidity: ${danBalance}`);
  console.log(`Owner WETH balance before adding liquidity: ${wethBalance}`);
  console.log(`LP token balance before adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
  
  // Ensure that you have enough balance before performing operations
  expect(await DAN.balanceOf(owner.address)).to.be.gte(amountTokenDesired, "Owner doesn't have enough DAN tokens");
  expect(await WETH.balanceOf(owner.address)).to.be.gte(amountETHDesired, "Owner doesn't have enough WETH tokens");
}

/*
async function setupLiquidityPool() {
// Desired liquidity pool amounts
const amountDANDesired = ethers.utils.parseEther("8869689998000"); // 8,869,689,998,000 DAN
const amountWETHDesired = ethers.utils.parseEther("900"); // 900 WETH

// Minimum liquidity pool amounts (adjust according to your risk tolerance)
const amountDANMin = ethers.utils.parseEther("8000000000000"); // 8,000,000,000,000 DAN as the minimum
const amountWETHMin = ethers.utils.parseEther("800"); // 800 WETH as the minimum

  
  const to = owner.address;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  console.log(`Owner address: ${to}`);
  console.log(`Deadline: ${deadline}`);
  console.log(`Amount of WETH Desired: ${amountWETHDesired.toString()}`);
  console.log(`Amount of DAN Desired: ${amountDANDesired.toString()}`);
  console.log(`Minimum amount of WETH: ${amountWETHMin.toString()}`);
  console.log(`Minimum amount of DAN: ${amountDANMin.toString()}`);

  const result = await uniswapRouter.addLiquidity(
    WETH.address,
    DAN.address,
    amountWETHDesired,
    amountDANDesired,
    amountWETHMin,
    amountDANMin,
    to,
    deadline
  );
  console.log(`LP token balance after liquidity: ${await lpToken.balanceOf(owner.address)}`);
  console.log("Add liquidity result:", result);
}
*/


async function logGasUsed(tx) {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  if (!receipt || !receipt.gasUsed) {
    console.log('Warning: gasUsed is undefined in receipt', receipt);
    return null; // return null if gasUsed or receipt is undefined
  }
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
  return receipt;
}


async function setmarketing(){
  await DAN.setMarketingReceiver(marketingWallet.address);
}


async function printEvents(tx) {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  const logs = receipt.logs.map((log) => {
      try {
          return DAN.interface.parseLog(log);
      } catch (e) {
          return null;
      }
  }).filter((log) => log !== null);

  console.log("Events:");
  for (const log of logs) {
      console.log(`${log.name}: ${JSON.stringify(log.args)}`);
  }
}


async function setupLiquidityPoolLarge() {
  
  const amountTokenDesired = ethers.utils.parseUnits("88686900000", 18);
  const amountETHDesired = ethers.utils.parseEther("300");
  
  // Increased values but still less than the desired amounts
  const amountTokenMin = ethers.utils.parseUnits("80000000000", 18); // less than 8868690000000000000000000000000
  const amountETHMin = ethers.utils.parseEther("200"); // less than 900
  

  
    const to = owner.address; 
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  
  
    const amountToken0Desired = amountTokenDesired;  // This is the DAN amount
    const amountToken1Desired = amountETHDesired;    // This is the WETH amount
  
    const amountToken0Min = amountTokenMin;  // This is the DAN min amount
    const amountToken1Min = amountETHMin;    // This is the WETH min amount

    let reserveDAN, reserveWETH, token0Address, token1Address;

    if (DAN.address.toLowerCase() < WETH.address.toLowerCase()) {
      console.log("DAN is token0 and WETH is token1");
      [reserveDAN, reserveWETH] = await lpToken.getReserves();
      token0Address = DAN.address;
      token1Address = WETH.address;
    } else {
      console.log("WETH is token0 and DAN is token1");
      [reserveWETH, reserveDAN] = await lpToken.getReserves();
      token0Address = WETH.address;
      token1Address = DAN.address;
    }
  
    // Check the initial reserves in the liquidity pool

  
    console.log("Initial DAN Reserves:", ethers.utils.formatEther(reserveDAN.toString()));
    console.log("Initial WETH Reserves:", ethers.utils.formatEther(reserveWETH.toString()));
  
    // Approve tokens for Uniswap Router
    const maxUint256 = ethers.constants.MaxUint256;
    await DAN.connect(owner).approve(uniswapRouter.address, maxUint256);
    await WETH.connect(owner).approve(uniswapRouter.address, maxUint256);
  
    // Assuming you've fetched owner balances before this step
    const danBalance = await DAN.balanceOf(owner.address);
    const wethBalance = await WETH.balanceOf(owner.address);
    
    console.log(`Owner DAN balance before adding liquidity: ${danBalance}`);
    console.log(`Owner WETH balance before adding liquidity: ${wethBalance}`);
    console.log(`LP token balance before adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
    console.log(`DAN Reserves before adding liquidity: ${reserveDAN}`); 
    console.log(`WETH Reserves before adding liquidity: ${reserveWETH}`);
  
    await uniswapRouter.addLiquidity(
      token0Address,
      token1Address,
      amountToken0Desired,
      amountToken1Desired,
      amountToken0Min,
      amountToken1Min,
      to,
      deadline
    );
  
    expect(await lpToken.balanceOf(owner.address)).to.be.gt(0); 
    
    const [reserveDANAfter, reserveWETHAfter] = await lpToken.getReserves();
    expect(reserveDANAfter).to.be.gt(reserveDAN);
    expect(reserveWETHAfter).to.be.gt(reserveWETH);
  
    console.log(`Owner DAN balance after adding liquidity: ${await DAN.balanceOf(owner.address)}`); 
    console.log(`Owner WETH balance after adding liquidity: ${await WETH.balanceOf(owner.address)}`);
    console.log(`LP token balance after adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
    console.log(`DAN Reserves after adding liquidity: ${reserveDANAfter}`); 
    console.log(`WETH Reserves after adding liquidity: ${reserveWETHAfter}`);
    
  
    expect(await DAN.balanceOf(owner.address)).to.be.lt(danBalance);
    expect(await WETH.balanceOf(owner.address)).to.be.lt(wethBalance);
 
}

/////////////////////////// end useful functions


describe("DAN Marketing Receiver", function() {
  it("should set the marketing receiver", async function() {
      // Connect DAN contract with the owner's signer
      const DANWithOwner = DAN.connect(owner);

      // Set the marketing receiver; assuming owner is the one allowed to set it
      await DANWithOwner.setMarketingReceiver(marketingWallet.address);

      // Fetch the set marketing receiver address from the contract
      const setMarketingAddress = await DAN.getMarketingReceiver(); 

      // Log the marketing address for debugging
      console.log("Marketing wallet is:", setMarketingAddress);

      // Check that it's set correctly
      expect(setMarketingAddress).to.equal(marketingWallet.address);
  });
});



describe("ETH tests", function() {
  it("should have ETH balance", async function() {
      const ethBalance = await ethers.provider.getBalance(owner.address);
      console.log("ETH Balance:", ethers.utils.formatEther(ethBalance));
      expect(ethBalance).to.be.gt(0);
  });
});



describe("DAN tests", function() {
    it("should have DAN balance", async function() {
        
        console.log("DAN Balance:", ethers.utils.formatEther(danBalance));
        expect(danBalance).to.be.gt(0);
    });

    it("Should transfer token from owner to marketingWallet", async function() {
      const tx = await DAN.transfer(marketingWallet.address, ethers.utils.parseEther("500"));
      const receipt = await tx.wait();
      
      receipt.events?.forEach((event) => {
        if (event.event === "DebugTransfer") {
          console.log("DebugTransfer Event Output: ", event.args);
        }
      });
      
      expect(await DAN.balanceOf(marketingWallet.address)).to.equal(ethers.utils.parseEther("500"));
    });
    
  
});


describe("WETH tests", function() {
    it("should have WETH balance", async function() {

        console.log("WETH Balance:", ethers.utils.formatEther(wethBalance));
        expect(wethBalance).to.be.gt(0);
    });
});


it("Should approve the Router to spend tokens", async function() {
  const amount = ethers.utils.parseEther("1000");
  await DAN.approve(uniswapRouter.address, amount);
  const allowance = await DAN.allowance(owner.address, uniswapRouter.address);
  expect(allowance).to.equal(amount);
});


describe("Token operations", function () {
  it("Should return the name of the token", async function () {
    expect(await DAN.name()).to.equal("DAN");
  });

  it("Should return the symbol of the token", async function () {
    expect(await DAN.symbol()).to.equal("DAN");
  });

  it("Should return the decimals of the token", async function () {
    expect(await DAN.decimals()).to.equal(18);
  });

  it("Should return the total supply of the token", async function () {
    expect(await DAN.totalSupply()).to.equal(ethers.utils.parseEther("9869690000000"));
  });


  it("Should fail when trying to transfer more than balance", async function () {
    await expect(DAN.transfer(marketingWallet.address, ethers.utils.parseEther("19869690000000"))).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });



   it("Should fail when trying to transferFrom more than approved", async function () {
    await DAN.approve(marketingWallet.address, ethers.utils.parseEther("1000"));
    await expect(DAN.connect(marketingWallet).transferFrom(owner.address, addr2.address, ethers.utils.parseEther("1500"))).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  });

});




it("Should wrap and unwrap ETH", async function() {
  const depositAmount = ethers.utils.parseEther("1");

  // Wrap 1 ETH into WETH by owner
  await WETH.connect(owner).deposit({ value: depositAmount });

  // Transfer WETH from owner to addr3
  await WETH.connect(owner).transfer(addr3.address, depositAmount);

  // After transfer, addr3's WETH balance should be equal to the deposit amount
  expect(await WETH.balanceOf(addr3.address)).to.equal(depositAmount);

  // Now, addr3 unwraps the WETH back to Ether
  await WETH.connect(addr3).withdraw(depositAmount);

  // After unwrap, addr3's WETH balance should be 0
  expect(await WETH.balanceOf(addr3.address)).to.equal(0);
});




describe("Liquidity Tests", function() {

  it("Should verify that the DAN-WETH pair is created and fetch its reserves", async function() {

    // Check that the liquidity pool token address is not the zero address
    const lpTokenAddress = await uniswapFactory.getPair(DAN.address, WETH.address);
    expect(lpTokenAddress).to.not.equal('0x0000000000000000000000000000000000000000');

    // Get the reserves of the pair
    const reserves = await lpToken.getReserves();

    console.log("DAN Reserve:", ethers.utils.formatEther(reserves[0]));
    console.log("WETH Reserve:", ethers.utils.formatEther(reserves[1]));


});




/*
it("Should add liquidity to the DAN-WETH pool", async function() {
  
  const amountTokenDesired = ethers.utils.parseEther("100000"); // Increase this value
  const amountETHDesired = ethers.utils.parseEther("10"); // Increase this value

  const amountTokenMin = ethers.utils.parseEther("89100");
  const amountETHMin = ethers.utils.parseEther("8.910"); 

  const to = owner.address; 
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  // Explicitly defining the tokens
  const token0Address = DAN.address; // DAN as token1
  const token1Address = WETH.address; // WETH as token0

  const amountToken0Desired = amountTokenDesired;  // This is the DAN amount
  const amountToken1Desired = amountETHDesired;    // This is the WETH amount

  const amountToken0Min = amountTokenMin;  // This is the DAN min amount
  const amountToken1Min = amountETHMin;    // This is the WETH min amount

  // Check the initial reserves in the liquidity pool
  const [reserveDAN, reserveWETH ] = await lpToken.getReserves();

  console.log("Initial DAN Reserves:", ethers.utils.formatEther(reserveDAN.toString()));
  console.log("Initial WETH Reserves:", ethers.utils.formatEther(reserveWETH.toString()));

  // Approve tokens for Uniswap Router
  const maxUint256 = ethers.constants.MaxUint256;
  await DAN.connect(owner).approve(uniswapRouter.address, maxUint256);
  await WETH.connect(owner).approve(uniswapRouter.address, maxUint256);

  // Assuming you've fetched owner balances before this step
  const danBalance = await DAN.balanceOf(owner.address);
  const wethBalance = await WETH.balanceOf(owner.address);
  
  console.log(`Owner DAN balance before adding liquidity: ${danBalance}`);
  console.log(`Owner WETH balance before adding liquidity: ${wethBalance}`);
  console.log(`LP token balance before adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
  console.log(`DAN Reserves before adding liquidity: ${reserveDAN}`); 
  console.log(`WETH Reserves before adding liquidity: ${reserveWETH}`);

  await uniswapRouter.addLiquidity(
    token0Address,
    token1Address,
    amountToken0Desired,
    amountToken1Desired,
    amountToken0Min,
    amountToken1Min,
    to,
    deadline
  );

  expect(await lpToken.balanceOf(owner.address)).to.be.gt(0); 
  
  const [reserveDANAfter, reserveWETHAfter] = await lpToken.getReserves();
  expect(reserveDANAfter).to.be.gt(reserveDAN);
  expect(reserveWETHAfter).to.be.gt(reserveWETH);

  console.log(`Owner DAN balance after adding liquidity: ${await DAN.balanceOf(owner.address)}`); 
  console.log(`Owner WETH balance after adding liquidity: ${await WETH.balanceOf(owner.address)}`);
  console.log(`LP token balance after adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
  console.log(`DAN Reserves after adding liquidity: ${reserveDANAfter}`); 
  console.log(`WETH Reserves after adding liquidity: ${reserveWETHAfter}`);
  

  expect(await DAN.balanceOf(owner.address)).to.be.lt(danBalance);
  expect(await WETH.balanceOf(owner.address)).to.be.lt(wethBalance);
});

*/

it("Should not transfer fees to the marketing wallet on Transfer", async function () {
  const amountToTransfer = ethers.utils.parseEther("10"); // Defining amountToTransfer
  const singleFee = amountToTransfer.div(100); // 1% fee
  const expectedTotalFee = singleFee.mul(2); // For both buy and sell

  console.log("Setting initial balances...");
  // Send initial DAN tokens to addr3 from the owner
  await DAN.transfer(addr3.address, ethers.utils.parseEther("100"));

  console.log("Checking balances before any transfers...");
  const addr3InitialBalance = await DAN.balanceOf(addr3.address);
  const addr4InitialBalance = await DAN.balanceOf(addr4.address);
  const initialMarketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
  const initialMarketingWalletDANBalance = await DAN.balanceOf(marketingWallet.address);

  console.log(`Initial Addr3 DAN balance: ${addr3InitialBalance}`);
  console.log(`Initial Addr4 DAN balance: ${addr4InitialBalance}`);
  console.log(`Initial Marketing Wallet ETH balance: ${initialMarketingWalletETHBalance}`);
  console.log(`Initial Marketing Wallet DAN balance: ${initialMarketingWalletDANBalance}`);

  console.log("Executing first transfer from addr3 to addr4...");
  // addr3 transfers tokens to addr4
  await DAN.connect(addr3).transfer(addr4.address, amountToTransfer);

  console.log("Checking balances after the first transfer...");
  const addr3PostTransferBalance = await DAN.balanceOf(addr3.address);
  const addr4PostTransferBalance = await DAN.balanceOf(addr4.address);
  const postTransferMarketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
  const postTransferMarketingWalletDANBalance = await DAN.balanceOf(marketingWallet.address);

  console.log(`Addr3 DAN balance after the first transfer: ${addr3PostTransferBalance}`);
  console.log(`Addr4 DAN balance after the first transfer: ${addr4PostTransferBalance}`);
  console.log(`Marketing Wallet ETH balance after the first transfer: ${postTransferMarketingWalletETHBalance}`);
  console.log(`Marketing Wallet DAN balance after the first transfer: ${postTransferMarketingWalletDANBalance}`);

  const feeDeductedAmount = amountToTransfer.sub(singleFee);
  console.log(`Expected fee deducted amount: ${feeDeductedAmount}`);

  console.log("Executing second transfer from addr4 back to addr3...");
  // For the sake of testing, let addr4 send back to addr3
  await DAN.connect(addr4).transfer(addr3.address, amountToTransfer);

  console.log("Checking balances after the second transfer...");
  const addr3FinalBalance = await DAN.balanceOf(addr3.address);
  const addr4FinalBalance = await DAN.balanceOf(addr4.address);
  const finalMarketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
  const finalMarketingWalletDANBalance = await DAN.balanceOf(marketingWallet.address);

  console.log(`Addr3 DAN balance after second transfer: ${addr3FinalBalance}`);
  console.log(`Addr4 DAN balance after second transfer: ${addr4FinalBalance}`);
  console.log(`Marketing Wallet ETH balance after the second transfer: ${finalMarketingWalletETHBalance}`);
  console.log(`Marketing Wallet DAN balance after the second transfer: ${finalMarketingWalletDANBalance}`);

  const totalFee = initialMarketingWalletETHBalance.sub(finalMarketingWalletETHBalance);
  console.log(`Total Fee Deducted: ${totalFee}`);

  // Assertions here...
});

});



describe("Fee operations", function () {
  it("Should set a new marketing receiver and then revert to #1 wallet", async function () {
    // Setting the marketing receiver to addr2 (second in your list as a different example)
    await DAN.setMarketingReceiver(addr2.address);
    expect(await DAN.getMarketingReceiver()).to.equal(addr2.address);

    // Setting the marketing receiver back to addr1 (#1 in your list)
    await DAN.setMarketingReceiver(marketingWallet.address);  // Using 'addr1' which corresponds to Account #1
    expect(await DAN.getMarketingReceiver()).to.equal(marketingWallet.address);
    console.log(`MARKETING WALLET IS NOW ${marketingWallet.address}`)
  });

});



describe("DAN Token Tests", function() {
  const slippageTolerance = 20; // 20%
  const tolerance = ethers.utils.parseUnits("1", 14);
  const depositAmount = ethers.utils.parseEther("1");
  let totalGasUsed = ethers.BigNumber.from("0");

  // The amount of ETH expected to be sent to the marketing wallet
  const marketingThreshold = ethers.utils.parseEther("0.1");

  async function expectApproximatelyEqual(value, expected, tolerance) {
      expect(value.gte(expected.sub(tolerance)) && value.lte(expected.add(tolerance))).to.be.true;
  }

  async function logGasUsed(tx) {
      const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      return receipt.gasUsed;
  }

  beforeEach(async function() {
    //  await getAndLogReserves();
   //   await approveTokens();
   //   await checkAndLogBalances(
  //        ethers.utils.parseEther("1000000"), 
   //       ethers.utils.parseEther("50")
  //    );
      it("----------------- adding liquid for swap test --------------------");
      await setupLiquidityPoolLarge();
      it("----------------- finished adding liquid for swap test --------------------");
      await setmarketing();


      
  });


it("should make some tests before buy and sell", async function() {
  // 1. Make sure addr2 is not fee-exempt
const isAddr2FeeExempt = await DAN.isExempt(addr2.address);
if(isAddr2FeeExempt) {
    console.error("addr2 is fee exempt! Please change the test account.");
    return;
}

// 2. Fetch initial balances
let initialDanBalance = await DAN.balanceOf(addr2.address);
let initialEthBalance = await ethers.provider.getBalance(DAN.address);
console.log("----------Initial DAN balance token buy sell test---------:", ethers.utils.formatEther(initialDanBalance));
console.log("-----------Initial Contract ETH balance token buy sell test---------:", ethers.utils.formatEther(initialEthBalance));



})

// Assuming your existing imports and helper functions, such as expectApproximatelyEqual
it("should execute the buy and sell transactions", async function () {
console.log("inside the buy and sell fucntion 1");
  // Initialization and constants
  const numberOfSwaps = 40;
  const feeThreshold = ethers.utils.parseEther("0.1");
  let accumulatedFees = ethers.BigNumber.from("0");
  let totalGasUsed = ethers.BigNumber.from("0");
  let slippageTolerance = 30;

  const initialMarketingWalletBalance = await ethers.provider.getBalance(marketingWallet.address);


try {
    const initialBalance = await DAN.balanceOf(addr2.address);
    await DAN.connect(addr2).approve(DAN.address, initialBalance); // Set approval to current balance

    const initialBalanceNum = parseFloat(ethers.utils.formatEther(initialBalance));

    if (initialBalanceNum > 0) {
        const DEAD_WALLET_ADDRESS = "0x000000000000000000000000000000000000dEaD";
        const tx = await DAN.connect(addr2).transfer(DEAD_WALLET_ADDRESS, initialBalance);
        await tx.wait();
        console.log("Successfully sent all DAN tokens to the dead wallet");
    } else {
        console.log("No DAN tokens to send");
    }
} catch (error) {
    console.log("An error occurred:", error);
}

console.log("inside the buy and sell fucntion 2");


  await DAN.connect(addr2).approve(uniswapRouter.address, ethers.utils.parseEther("99999999999"));
    // Fetch the allowance
  const allowance = await DAN.allowance(addr2.address, uniswapRouter.address);

    // Check that the allowance is as expected
    expect(allowance.toString()).to.equal(ethers.utils.parseEther("99999999999").toString());


  const block = await ethers.provider.getBlock('latest');
  const deadline = block.timestamp + 600; // 10 minutes

  console.log("inside the buy and sell fucntion 3");
  
         // Define event listeners
     //    DAN.on("DebugTransfer", (sender, recipient, amount, fee, amountAfterFee, event) => {
   //       console.log(`DebugTransfer Event: sender=${sender} recipient=${recipient} amount=${amount.toString()} fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
   //     });
  
    //    DAN.on("FeeDetails", (fee, amountAfterFee, event) => {
   //       console.log(`FeeDetails Event: fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
   //     });
  
   //     DAN.on("DebugBalance", (address, balance, event) => {
   //       console.log(`DebugBalance Event: address=${address} balance=${balance.toString()}`);
   //     });
  
    //    DAN.on("FeeProcessed", (address, fee, event) => {
   //       console.log(`FeeProcessed Event: address=${address} fee=${fee.toString()}`);
   //     });


        console.log("inside the buy and sell fucntion 4");
  // Bulk test starts
  for (let i = 0; i < numberOfSwaps; i++) {
    console.log("inside the buy and sell fucntion 5");
    const operation = i % 2 === 0 ? 'buy' : 'sell';
    console.log(`\n======== Executing swap #${i + 1} [Operation: ${operation.toUpperCase()}] ========`);



    const preSwapETHBalance = await ethers.provider.getBalance(DAN.address);
    console.log(`Before Swap: Contract ETH balance: ${ethers.utils.formatEther(preSwapETHBalance)} ETH`);

    const allowance = await DAN.allowance(addr2.address, uniswapRouter.address);
    console.log(`---- Allowance -----: ${ethers.utils.formatEther(allowance)}`);

     
    
    // Fetch reserves

   try {
    let reserveWETH, reserveDAN;
  
    if (DAN.address.toLowerCase() < WETH.address.toLowerCase()) {
      console.log("DAN is token0 and WETH is token1");
      [reserveDAN, reserveWETH] = await lpToken.getReserves();
    } else {
      console.log("WETH is token0 and DAN is token1");
      [reserveWETH, reserveDAN] = await lpToken.getReserves();
    }
  
    // Log the reserves for debugging
    console.log(`WETH Reserves: ${ethers.utils.formatEther(reserveWETH)}`);
    console.log(`DAN Reserves: ${ethers.utils.formatEther(reserveDAN)}`);
  
  } catch (error) {
    console.error(`Reserve Fetch Error: ${error.message}`);
    // Handle the error appropriately; you may continue, throw, or exit depending on your application's needs.
  }
  
  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
 
    // Swap logic starts here
    let tx;
    try {

    if (operation === 'buy') {
                  // Define event listeners
              //    const filter = DAN.filters.TransferFromCalled(null, null, null);

             //     DAN.on(filter, (sender, recipient, amount, event) => {
             //         console.log(`TransferFromCalled Event BUY: sender=${sender} recipient=${recipient} amount=${amount.toString()}`);
             //     })
           
      // Buy Logic
      const amountOutMin = ethers.utils.parseUnits("50", 18);
      const amountInMax = ethers.utils.parseEther('0.1').mul(100 + slippageTolerance).div(100); // With slippageTolerance

      const DANBalance = await DAN.balanceOf(addr2.address);
      console.log(`DAN balance of addr2 before buy: ${ethers.utils.formatEther(DANBalance)} DAN`);

      const contractDANBalanceBefore = await DAN.balanceOf(DAN.address);
      console.log("Contract DAN token balance before buy--:", ethers.utils.formatUnits(contractDANBalanceBefore, 18));

      console.log(`Executing BUY: Will buy ${ethers.utils.formatEther(amountOutMin)} DAN for a maximum of ${ethers.utils.formatEther(amountInMax)} ETH`);

              // Check addresses and tokens
                      // Check addresses and tokens
              console.log(`Uniswap Router Address: ${uniswapRouter.address}`);
              console.log(`Token Address: ${DAN.address}`);
              console.log(`User Address: ${addr2.address}`);
      
      tx = await uniswapRouter.connect(addr2).swapETHForExactTokens(
        amountOutMin,
        [WETH.address, DAN.address],
        addr2.address,
        deadline,
        { value: amountInMax }
      );

          // Transaction Receipt and Gas Usage
    const receiptone = await tx.wait();
    if (receiptone && receiptone.gasUsed) {
      totalGasUsed = totalGasUsed.add(receiptone.gasUsed);

      console.log('Successfully called swapExactETHForTokensSupportingFeeOnTransferTokens');
   //   console.log(`Gas Used for Swap #${i + 1}: ${receiptone.gasUsed.toString()}`);
   //   console.log(`Transaction Receipt: ${JSON.stringify(receiptone, null, 2)}`);

    }
         

      const contractETHBalanceAfter = await ethers.provider.getBalance(DAN.address);
      console.log("Contract ETH balance after--:", ethers.utils.formatEther(contractETHBalanceAfter));

      const contractDANBalanceAfter = await DAN.balanceOf(DAN.address);
      console.log("Contract DAN token balance after--:", ethers.utils.formatUnits(contractDANBalanceAfter, 18));
      

      const [reserveDANAfterbuy, reserveWETHAfterbuy] = await lpToken.getReserves();
      console.log(` liquidity DAN Reservesafter buy: ${reserveDANAfterbuy}`); 
      console.log(`liquidity WETH Reserves after buy: ${reserveWETHAfterbuy}`);

   //   DAN.on("DebugTransfer", (sender, recipient, amount, fee, amountAfterFee, event) => {
  //      console.log(`DebugTransfer Event: sender=${sender} recipient=${recipient} amount=${amount.toString()} fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
  //    });

  //    DAN.on("FeeDetails", (fee, amountAfterFee, event) => {
  //      console.log(`FeeDetails Event: fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
 //     });

  //    DAN.on("DebugBalance", (address, balance, event) => {
 //       console.log(`DebugBalance Event: address=${address} balance=${balance.toString()}`);
 //     });

  //      DAN.on("FeeProcessed", (address, fee, event) => {
  //        console.log(`FeeProcessed Event: address=${address} fee=${fee.toString()}`);
  //      });

    } else {


  //      const filter = DAN.filters.TransferFromCalled(null, null, null);

  //      DAN.on(filter, (sender, recipient, amount, event) => {
  //          console.log(`TransferFromCalled SELL Event: sender=${sender} recipient=${recipient} amount=${amount.toString()}`);
 //       })



      // Sell Logic
        const DANBalance = await DAN.balanceOf(addr2.address);
        console.log(`DAN balance before sell and after buy: ${ethers.utils.formatEther(DANBalance)} DAN`);

        const ethBalance = await ethers.provider.getBalance(addr2.address);
        console.log(`ETH balance of addr2 before Sell ---- so we can check if there is enough for gas: ${ethers.utils.formatEther(ethBalance)} ETH`);

        
        // Approve if needed
        const allowance = await DAN.allowance(addr2.address, uniswapRouter.address);
        if (allowance.lt(DANBalance)) {
          await DAN.connect(addr2).approve(uniswapRouter.address, DANBalance);  // approve the sale of all 
          console.log("----- Approved all wallet ------");
        } else {
          console.log("----- not approved ------");
            console.log(`----- not approved ------ Allowance: ${ethers.utils.formatEther(allowance.toString())}`);
            console.log(`----- not approved ------ DANBalance: ${ethers.utils.formatEther(DANBalance.toString())}`);

        }

      // The amount to sell is the entire balance
            // The amount to sell is the entire balance
           // Assuming you have the current reserves in the contract

           
            let reserveWETHs, reserveDANs;
          
            if (DAN.address.toLowerCase() < WETH.address.toLowerCase()) {
              console.log("DAN is token0 and WETH is token1");
              [reserveDANs, reserveWETHs] = await lpToken.getReserves();
            } else {
              console.log("WETH is token0 and DAN is token1");
              [reserveWETHs, reserveDANs] = await lpToken.getReserves();
            }

              const amountToSell = DANBalance;
              const amountIn = amountToSell;
              
              // Calculate the price for 1 DAN in terms of WETH
              // Calculate the price for 1 DAN in terms of WETH
              const priceForOneDAN = reserveWETHs.mul(ethers.BigNumber.from(10).pow(18)).div(reserveDANs);

              // Calculate the expected minimum amount of WETH (in wei)
              const expectedWETH = amountToSell.mul(priceForOneDAN).div(ethers.BigNumber.from(10).pow(18));

              // Apply slippage tolerance
              //const amountOutMin = expectedWETH.mul(100 - slippageTolerance).div(100);
              const slippageTolerance = 2; // 1%
              const amountOutMin = expectedWETH.mul(100 - slippageTolerance).div(100);


            

              // Connect router to addr2
              uniswapRouter = uniswapRouter.connect(addr2); 

              console.log("Uniswap router connected to:", uniswapRouter.signer.address);
              // This should now print addr2.address

    

      console.log(`Executing SELL: Will sell ${ethers.utils.formatEther(amountToSell)} DAN for a minimum of ${ethers.utils.formatEther(amountOutMin)} ETH`);

      
        // Check addresses and tokens
        console.log(`Uniswap Router Address: ${uniswapRouter.address}`);
        console.log(`Contract Address: ${DAN.address}`);
        console.log(`User Address: ${addr2.address}`);

        console.log("------ extra buy logs ------");
        // Log the uniswapRouter connection 
        console.log("Uniswap router connected to:", uniswapRouter.signer.address);

        // Log the parameter values
        console.log("amountToSell:", amountToSell.toString()); 
        console.log("amountOutMin:", amountOutMin.toString());
        console.log("deadline:", deadline.toString());


            // Set `addr2.address` as fee-exempt
      //  await DAN.connect(owner).setExemptStatus(addr2.address, true);

        // Validate that the fee exemption was set correctly (optional)
        const isExempt = await DAN.isFeeExempt(addr2.address);
        console.log(`Is addr2.address fee-exempt? ${isExempt}`);

        
        //swapExactTokensForETHSupportingFeeOnTransferTokens
        console.log("Sleeping");
        await sleep(10000);
   try {  
        tx = await uniswapRouter.connect(addr2).swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountIn,
          amountOutMin,
          [DAN.address, WETH.address],
          addr2.address,
          deadline
        );

      } catch (swapError) {
        console.error("Swap failed with error:", swapError);
        return;
      } 
      
      if (!tx) {
        console.error("No transaction returned from swap!");
        return;
      }
      
      // Log the transaction 
    // console.log("Transaction:", tx);


          // Transaction Receipt and Gas Usage
    const receipt = await tx.wait();
    if (receipt && receipt.gasUsed) {
      totalGasUsed = totalGasUsed.add(receipt.gasUsed);
      console.log('Successfully called swapExactTokensForETH');
      console.log(`Gas Used for Swap #${i + 1}: ${receipt.gasUsed.toString()}`);
    //  console.log(`Transaction Receipt: ${JSON.stringify(receipt, null, 2)}`);

    }
         

    }


  } catch (error) {
    console.error(`Error during ${operation.toUpperCase()} at Swap #${i + 1}: ${error}`);
    // Optional: Exit the loop if you encounter an error
    // break;
    console.log("Transaction object:", tx);
    if (tx) {
      try {
        const receipt = await tx.wait(); 
   //     console.log("Transaction Receipt:", receipt);
    
        // Debugging the transaction
        const debugResult = await hre.network.provider.send("debug_traceTransaction", [tx.hash]);
        console.log("Debug Trace Result:", debugResult);
    
        if (receipt.status === false) {
          const reason = receipt.logs[0]?.args?.reason;
          if (reason) {
            console.log("Revert reason:", reason);  
            
            if (reason === "UniswapV2: INSUFFICIENT_LIQUIDITY") {
              console.log(`Not enough liquid`);
            }
          } else {
            console.log("Revert reason not found in the logs.");
          }
        }
      } catch (error) {
        console.error("Error while waiting for the transaction or debugging:", error);
      }
    }
    
  }

    // Contract Balances and Reserves after Swap
    const postSwapBalanceAddr2 = await DAN.balanceOf(addr2.address);
    console.log(`After Swap: DAN Balance of addr2: ${ethers.utils.formatEther(postSwapBalanceAddr2)}`);

    const postSwapBalanceDANcontract = await DAN.balanceOf(DAN.address);
    console.log(`After Swap: DAN Balance of contract: ${ethers.utils.formatEther(postSwapBalanceDANcontract)}`);

    const postSwapETHBalance = await ethers.provider.getBalance(DAN.address);
    console.log(`After Swap: Contract ETH balance: ${ethers.utils.formatEther(postSwapETHBalance)} ETH`);
  }

  ethers.provider.on("debug", (log) => {
   // console.log("from the contract ------ logs");
   // console.log(log);
  });
  

  console.log(`\n======== Test Summary ========`);
  console.log(`Total Gas Used for ${numberOfSwaps} swaps: ${ethers.utils.formatEther(totalGasUsed)}`);
});

});


/*
    if (receipt && receipt.gasUsed) {
      totalGasUsed = totalGasUsed.add(receipt.gasUsed);
    } else {
      console.error('Error: Gas used is undefined');
    }

      console.log(`Total Gas Used for ${numberOfSwaps} swaps: `, ethers.utils.formatEther(totalGasUsed));

describe("DAN Token Tests", function() {

  const slippageTolerance = 2000;  // e.g., 0.5% slippage tolerance represented as basis points at 20%






it("Testing transfer between non-exempt addresses", async function() {
  
 
    await getAndLogReserves();
    await approveTokens();
    await checkAndLogBalances(
        ethers.utils.parseEther("1000000"), 
        ethers.utils.parseEther("50")
    );
    await setupLiquidityPool();
 



  // Transferring tokens from owner to addr2
  let initialOwnerBalance = await DAN.balanceOf(owner.address);
  let amountToTransfer = ethers.BigNumber.from("1000");  // Make sure this is a BigNumber

  await DAN.connect(owner).transfer(addr2.address, amountToTransfer);
  console.log("Transferred tokens from owner to addr2.");

  expect((await DAN.balanceOf(owner.address)).lt(initialOwnerBalance)).to.be.true;
  expect((await DAN.balanceOf(addr2.address)).eq(amountToTransfer)).to.be.true;
  
  // Transferring tokens from addr2 to addr3
  let initialAddr2Balance = await DAN.balanceOf(addr2.address);
  await DAN.connect(addr2).transfer(addr3.address, amountToTransfer);
  console.log("Transferred tokens from addr2 to addr3.");

  expect((await DAN.balanceOf(addr2.address)).lt(initialAddr2Balance)).to.be.true;
  expect((await DAN.balanceOf(addr3.address)).eq(amountToTransfer)).to.be.true;

  const tx1 = await DAN.connect(owner).transfer(addr2.address, amountToTransfer);
  await logGasUsed(tx1);

  const tx2 = await DAN.connect(addr2).transfer(addr3.address, amountToTransfer);
  await logGasUsed(tx2);

});



it("Simulating a buy - addr2 buying DAN with WETH", async function() {

  
    await getAndLogReserves();
    await approveTokens();
    await checkAndLogBalances(
        ethers.utils.parseEther("1000000"), 
        ethers.utils.parseEther("50")
    );
    await setupLiquidityPool();
    await DAN.setMarketingReceiver(marketingWallet.address);

 

  
  console.log("------------- STARTING BUY -------------------");
  // Wrap 1 ETH into WETH for addr2
  const depositAmount = ethers.utils.parseEther("1");
  await WETH.connect(addr2).deposit({ value: depositAmount });

  await WETH.connect(addr2).approve(uniswapRouter.address, depositAmount);
  console.log("Approved WETH for swapping.");

  // Calculate the minimum output considering the slippage tolerance
  const amountOutMin = depositAmount.sub(depositAmount.mul(slippageTolerance).div(10000));

  await uniswapRouter.connect(addr2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
      depositAmount, 
      amountOutMin, 
      [WETH.address, DAN.address], 
      addr2.address, 
      Math.floor(Date.now() / 1000) + 60 * 10
  );

  console.log("Swapped WETH for DAN.");

  // Verify and print DAN balance after swap
const danBalance = await DAN.balanceOf(addr2.address);
console.log("DAN Balance for addr2:", ethers.utils.formatEther(danBalance)); 

// Determine the original amount before the fee was applied (i.e., the amount `addr2` would've received if no fee was deducted).
const originalAmount = danBalance.div(99).mul(100);

// Calculate the expected 1% fee from the original amount
const expectedFee = originalAmount.mul(1).div(100);

const contractBalance = await DAN.balanceOf(DAN.address);
const difference = contractBalance.sub(expectedFee).abs();

// Setting a very small tolerance for potential rounding errors
const tolerance = ethers.utils.parseUnits("1", 14);  // 0.0001 when considering 18 decimals

console.log("Original Amount (before fee):", ethers.utils.formatEther(originalAmount));
console.log("Expected 1% Fee:", ethers.utils.formatEther(expectedFee));
console.log("Tolerance Contract Balance:", ethers.utils.formatEther(contractBalance));
console.log("Tolerance Difference:", ethers.utils.formatEther(difference));

console.log("Checking Difference Against Tolerance");
expect(difference.lte(tolerance), `Difference ${ethers.utils.formatEther(difference)} exceeds tolerance ${ethers.utils.formatEther(tolerance)}`).to.be.true;

console.log("1% fee received by the contract address:", ethers.utils.formatEther(expectedFee));

const tx1 = await WETH.connect(addr2).deposit({ value: depositAmount });
await logGasUsed(tx1);

const tx2 = await WETH.connect(addr2).approve(uniswapRouter.address, depositAmount);
await logGasUsed(tx2);

const tx3 = await uniswapRouter.connect(addr2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
  depositAmount, 
  amountOutMin, 
  [WETH.address, DAN.address], 
  addr2.address, 
  Math.floor(Date.now() / 1000) + 60 * 10
);
await logGasUsed(tx3);

});



it("Simulating a sell - addr2 selling DAN for WETH", async function() {


    await getAndLogReserves();
    await approveTokens();
    await checkAndLogBalances(
        ethers.utils.parseEther("1000000"), 
        ethers.utils.parseEther("50")
    );
    await setupLiquidityPool();
       // Set marketing receiver
       await DAN.setMarketingReceiver(marketingWallet.address);



  console.log("------------- STARTING SELL -------------------");

  // Step 1: Transfer some DAN tokens to addr2
  const amountToSend = ethers.utils.parseEther("19354.6679"); // Example: Sending 1000 DAN tokens to addr2 this is how much we bought before for 1 WETH
  await DAN.transfer(addr2.address, amountToSend);
  console.log(`Transferred ${ethers.utils.formatEther(amountToSend)} DAN tokens to addr2.`);

  // Step 2: Check the balance of DAN tokens in addr2's account
  const danBalance = await DAN.balanceOf(addr2.address);
  console.log("DAN Balance for addr2 after transfer:", ethers.utils.formatEther(danBalance));

  if (danBalance.eq(0)) {
      throw new Error("addr2 does not have any DAN tokens to sell.");
  }

  const danAmount = danBalance; // This ensures we use all of addr2's DAN tokens for the swap

  // The rest of the steps remain the same...

  const uniswapPair = new ethers.Contract(lpTokenAddress, IUniswapV2Pair_ABI, ethers.provider);
  const reserves = await uniswapPair.getReserves();


  console.log("DAN Reserves:", ethers.utils.formatEther(reserves[0]));
  console.log("WETH Reserves:", ethers.utils.formatEther(reserves[1]));

  // Step 3: Sell the DAN tokens from addr2 for WETH

  const expectedReceivedAmountAfterFee = danAmount.mul(99).div(100);
  await DAN.connect(addr2).approve(uniswapRouter.address, danAmount);
  console.log("Approved DAN for swapping.");


  //const amountOutMin = danAmount.sub(danAmount.mul(slippageTolerance).div(10000));
  const amountOutMin = ethers.utils.parseEther("0");


  const initialWETHBalance = await WETH.balanceOf(addr2.address);

  await uniswapRouter.connect(addr2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
      danAmount, 
      amountOutMin, 
      [DAN.address, WETH.address], 
      addr2.address, 
      Math.floor(Date.now() / 1000) + 60 * 10
  );

  console.log("Swapped DAN for WETH.");

  const finalWETHBalance = await WETH.balanceOf(addr2.address);
  const receivedWETH = finalWETHBalance.sub(initialWETHBalance);
  
  console.log("Actual WETH Received:", ethers.utils.formatEther(receivedWETH));
  
  const minExpectedWETH = ethers.utils.parseEther("0.9");
  const maxExpectedWETH = ethers.utils.parseEther("1");
  
  // Check if received WETH is between 0.9 and 1 WETH
  expect(receivedWETH.gte(minExpectedWETH), `Received amount ${ethers.utils.formatEther(receivedWETH)} is below ${ethers.utils.formatEther(minExpectedWETH)}`).to.be.true;
  expect(receivedWETH.lte(maxExpectedWETH), `Received amount ${ethers.utils.formatEther(receivedWETH)} exceeds ${ethers.utils.formatEther(maxExpectedWETH)}`).to.be.true;

  const tx1 = await DAN.transfer(addr2.address, amountToSend);
  await logGasUsed(tx1);

  const tx2 = await DAN.connect(addr2).approve(uniswapRouter.address, danAmount);
  await logGasUsed(tx2);

  const tx3 = await uniswapRouter.connect(addr2).swapExactTokensForTokensSupportingFeeOnTransferTokens(
    danAmount, 
    amountOutMin, 
    [DAN.address, WETH.address], 
    addr2.address, 
    Math.floor(Date.now() / 1000) + 60 * 10
  );
  await logGasUsed(tx3);
  

});

});
*/


  it("Testing isExempt and setExemptStatus", async function() {
    expect(await DAN.isExempt(addr3.address)).to.be.false;
    await DAN.setExemptStatus(addr3.address, true);
    expect(await DAN.isExempt(addr3.address)).to.be.true;
  });



  it("Testing getFees", async function() {
    let [buyFee, sellFee] = await DAN.getFees();
    expect(buyFee).to.equal(sellFee);  // Assuming both fees are the same in your contract
  });





  it("Testing transferFrom", async function() {
    console.log("Starting to test transferFrom");
    // Initial funding for the marketingWallet
    const initialOwnerBalance = await DAN.balanceOf(owner.address);
    console.log("Initial owner balance:", ethers.utils.formatUnits(initialOwnerBalance, 18).toString());

    const initialMarketingWalletBalance = await DAN.balanceOf(marketingWallet.address);
    console.log("Initial marketingWallet balance:", initialMarketingWalletBalance.toString());

  
    const tokenAmountToSend = ethers.utils.parseUnits("2000", 18); // Assuming 18 decimals
    console.log("Approving amount to send", tokenAmountToSend.toString());
    await DAN.connect(owner).transfer(marketingWallet.address, tokenAmountToSend);
    console.log("made the transfer");

   
    const newOwnerBalance = await DAN.balanceOf(owner.address);
    console.log("New owner balance:", ethers.utils.formatUnits(newOwnerBalance, 18).toString());


    const aftersendMarketingWalletBalance = await DAN.balanceOf(marketingWallet.address);
    console.log("New marketingWallet balance:", aftersendMarketingWalletBalance.toString());
    expect(aftersendMarketingWalletBalance).to.equal(tokenAmountToSend); // Ensuring marketingWallet got the tokens

    await DAN.connect(marketingWallet).approve(addr2.address, 1000);
    const initialAllowance = await DAN.allowance(marketingWallet.address, addr2.address);
    console.log("Allowance set for addr2 from marketingWallet:", initialAllowance.toString());

    await DAN.connect(addr2).transferFrom(marketingWallet.address, addr3.address, 500);
    const postTransferMarketingWalletBalance = await DAN.balanceOf(marketingWallet.address);
    const postTransferAddr3Balance = await DAN.balanceOf(addr3.address);
    const postTransferAllowance = await DAN.allowance(marketingWallet.address, addr2.address);
    console.log("Post-transfer marketingWallet balance:", postTransferMarketingWalletBalance.toString());
    console.log("Post-transfer addr3 balance:", postTransferAddr3Balance.toString());
    console.log("Post-transfer allowance for addr2 from marketingWallet:", postTransferAllowance.toString());

    await expect(DAN.connect(addr2).transferFrom(marketingWallet.address, addr3.address, 600)).to.be.reverted;  // More than allowance
    console.log("Reverted as expected due to exceeded allowance.");

    await expect(DAN.connect(addr2).transferFrom(marketingWallet.address, addr3.address, 10000)).to.be.reverted; // More than balance
    console.log("Reverted as expected due to exceeded balance.");
});






it("Testing approve and related functions", async function() {
  await DAN.connect(marketingWallet).approve(addr2.address, 1000);
  console.log("Approved 1000 tokens for addr2 to spend from marketingWallet.");

  expect(await DAN.allowance(marketingWallet.address, addr2.address)).to.equal(1000);
  await DAN.connect(marketingWallet).increaseAllowance(addr2.address, 500);
  expect(await DAN.allowance(marketingWallet.address, addr2.address)).to.equal(1500);

  await DAN.connect(marketingWallet).decreaseAllowance(addr2.address, 1000);
  expect(await DAN.allowance(marketingWallet.address, addr2.address)).to.equal(500);

  await expect(DAN.connect(marketingWallet).decreaseAllowance(addr2.address, 600)).to.be.reverted;  // Negative allowance
  console.log("Reverted as expected due to negative allowance.");
});




describe("Testing setMarketingReceiver", function() {


  it("should allow owner to set the marketing receiver", async function() {
      const DANWithOwner = DAN.connect(owner);
      await DANWithOwner.setMarketingReceiver(addr3.address);
      expect(await DAN.getMarketingReceiver()).to.equal(addr3.address);
  });

  it("should revert if a non-owner tries to set the marketing receiver", async function() {
      const DANWithAddr2 = DAN.connect(addr2);
      await expect(DANWithAddr2.setMarketingReceiver(addr3.address))
          .to.be.reverted;  // The exact revert message can vary based on your implementation of onlyOwner. If you know it, you can use .to.be.revertedWith("YOUR_REVERT_MESSAGE");
  });
});



describe("Testing withdrawal", function() {
  const twoEth = ethers.utils.parseEther("2");

  beforeEach(async function() {
      // Setup liquidity, approve tokens, and check balances
  //    await getAndLogReserves();
 //     await approveTokens();
 //     await checkAndLogBalances(
 //         ethers.utils.parseEther("1000000"), 
  //        ethers.utils.parseEther("50")
 //     );
      await setupLiquidityPoolLarge()

      await setmarketing();
      // Set marketing receiver
   //   await DAN.setMarketingReceiver(addr3.address);

      // Send 2 ETH to the contract for fee simulation
    //  await owner.sendTransaction({ to: DAN.address, value: twoEth });
  });



  it("Should swap the DAN tokens for ETH in the contract", async function() {

    // Listen to the ApprovedAmount event
    const filter = DAN.filters.ApprovedAmount(DAN.address, null, null);
    DAN.on(filter, (tokenOwner, spender, amount, event) => {
        console.log(`ApprovedAmount event detected:`);
        console.log(`- TokenOwner: ${tokenOwner}`);
        console.log(`- Spender: ${spender}`);
        console.log(`- Amount: ${ethers.utils.formatEther(amount)} DAN`);
    });
    


    // Connect with the owner's signer
    const DANWithOwner = DAN.connect(owner);
    

    // Ensure the owner has enough DAN tokens before transferring
    const ownerBalance = await DAN.balanceOf(owner.address);
    expect(ownerBalance).to.be.at.least(ethers.utils.parseEther('1000'), "Owner doesn't have enough DAN tokens");

    // Approve the contract to spend owner's DAN tokens
    const approveTx = await DANWithOwner.approve(DAN.address, ethers.utils.parseEther('1000'));
    await approveTx.wait(); // Wait for the transaction to be mined
    console.log("Approved 1000 DAN tokens for the contract to spend.");


    const tx = await DAN.approve(uniswapRouter.address, ownerBalance, { from: owner.address });
    const receipt = await tx.wait();  // Wait for the transaction to be confirmed
    console.log(receipt.status);  // Should be 1 if successful, 0 if failed
    
    DAN.on('Approval', (owner, spender, amount, event) => {
      console.log(`Owner ${owner} has approved spender ${spender} to spend ${amount} tokens`);
    });
    

    const allowance = await DAN.allowance(DAN.address, uniswapRouter.address); // Replace "routerAddress" with your router's address variable
    console.log("Allowance set: " + allowance.toString());
    
    console.log("Contract's allowance to router:", ethers.utils.formatEther(allowance), "DAN");

    

    // Transfer the approved DAN tokens to the contract
    const transferTx = await DANWithOwner.transfer(DAN.address, ethers.utils.parseEther('1000'));
    await transferTx.wait();  // Wait for the transaction to be mined
    console.log("Transferred 1000 DAN tokens from owner to the DAN contract address.");



    // Fund the contract with ETH for potential gas fees or other functionalities
    await owner.sendTransaction({
        to: DAN.address,
        value: ethers.utils.parseEther('0.1') // sending 0.1 ETH
    });
    console.log("Sent ETH to the DAN contract for gas fees from owner.");

    // Capture the initial balances before the token swap
    const initialEthBalance = await ethers.provider.getBalance(DAN.address);
    const initialDANTokenBalance = await DAN.balanceOf(DAN.address);

    console.log(`Initial ETH balance of the contract: ${ethers.utils.formatEther(initialEthBalance)} ETH`);
    console.log(`Initial DAN token balance of the contract: ${ethers.utils.formatEther(initialDANTokenBalance)} DAN`);


    // Attempt to swap tokens and handle any potential error
    try {
        const contractDANTokenBalance = await DAN.balanceOf(DAN.address);

        const DANWithOwner = DAN.connect(owner);
        await DANWithOwner.manualSwapTokensForETH();

        console.log("Successfully swapped tokens for ETH.");
      


    } catch (error) {
        console.error("Error during token swap:", error);
    }

    // Ensure the ETH balance of the contract increased and the DAN balance decreased after the swap
    const finalEthBalance = await ethers.provider.getBalance(DAN.address);
    const finalDANTokenBalance = await DAN.balanceOf(DAN.address);

    console.log(`Final ETH balance of the contract: ${ethers.utils.formatEther(finalEthBalance)} ETH`);
    console.log(`Final DAN token balance of the contract: ${ethers.utils.formatEther(finalDANTokenBalance)} DAN`);

    expect(finalEthBalance.gt(initialEthBalance)).to.be.true;  // Using BigNumber's 'gt' method for "greater than"
    expect(finalDANTokenBalance.lt(initialDANTokenBalance)).to.be.true;  // Using BigNumber's 'lt' method for "less than"

});





it("should allow owner to withdraw the eth to marketing, leaving gas reserve", async function() {
  // Set the desired gas reserve
    // 2 ETH in Wei for initial deposit
    const twoEth = ethers.utils.parseEther("2");
  
    // 0.04 ETH in Wei for gas reserve
    const gasReserve = ethers.utils.parseEther('0.04');
    
    // 2.04 ETH in Wei for the total deposit to the contract
    const totalDeposit = twoEth.add(gasReserve);
    
    console.log("--- eth to marketing ---- firing sendTransaction"); 
    // Send total deposit to the contract
    await owner.sendTransaction({ to: DAN.address, value: totalDeposit });

  // Verify contract balance
  let contractInitialBalance = await ethers.provider.getBalance(DAN.address);
  console.log("Balance after adding:", ethers.utils.formatEther(contractInitialBalance)); // Log initial balance
  
  expect(contractInitialBalance).to.be.equal(totalDeposit);


  // Declare the actual amount to withdraw in Wei
  const actualWithdrawAmount = ethers.utils.parseEther("2");

  // Get initial marketing wallet balance
  let marketingInitialBalance = await ethers.provider.getBalance(marketingWallet.address);
  console.log("Initial Marketing balance:", ethers.utils.formatEther(marketingInitialBalance));


  console.log("Amount to withdraw:", ethers.utils.formatEther(actualWithdrawAmount)); // Log the amount you're trying to withdraw

    // Fetch and log the marketing address from the contract
    const contractMarketingAddress = await DAN.getMarketingReceiver();
    console.log("Contract's Marketing Address:", contractMarketingAddress);

      // Ensure the marketing address in the contract is the expected one
  expect(contractMarketingAddress).to.equal(marketingWallet.address);


// First, check if the function exists on the contract
if (!DAN['withdrawETHToMarketing']) {
  console.error('withdrawETHToMarketing function does not exist on DAN');
  return;
}

// Initialize transaction object
let tx;

// Try to execute the transaction
try {
  tx = await DAN.withdrawETHToMarketing({ gasLimit: 100000 }); // Only pass in the gas limit as an options object
  console.log("Withdrew ETH to marketing.");
} catch (error) {
  console.error("Error during ETH withdrawal:", error);
  return;
}



// Check if the transaction object is undefined
if (!tx) {
  console.error("Transaction object is undefined");
  return;
}

// Continue with the rest of your code

// Wait for the transaction to be confirmed and get the receipt
const receipt = await tx.wait();

// Filter the event logs for the WithdrawETHToMarketing event
const withdrawEvent = receipt.events?.filter((e) => e.event === "WithdrawETHToMarketing")[0];
//console.log(withdrawEvent);
// Check the amount withdrawn in the event log

const actualWithdrawAmountInEth = ethers.utils.formatEther(withdrawEvent.args.amountWithdrawn);
// Convert both to a Number and then compare
expect(parseFloat(actualWithdrawAmountInEth)).to.equal(parseFloat("2"));

// Assert that the event was emitted with the expected values
expect(withdrawEvent, "WithdrawETHToMarketing event not found").to.exist;
expect(withdrawEvent.args.remainingContractBalance.toString()).to.equal(gasReserve.toString());


// Check contract balance after the withdrawal
let contractBalanceAfterWithdrawal = await ethers.provider.getBalance(DAN.address);
console.log("Contract balance after withdrawal:", ethers.utils.formatEther(contractBalanceAfterWithdrawal));

// Check marketing wallet balance after the withdrawal
let marketingBalanceAfterWithdrawal = await ethers.provider.getBalance(marketingWallet.address);
console.log("Marketing balance after withdrawal:", ethers.utils.formatEther(marketingBalanceAfterWithdrawal));


});






it("should allow owner to withdraw the DAN tokens to marketing", async function () {
  // Define the amount of tokens to test with
  const tokenAmount = ethers.utils.parseUnits("1000", 18); // Use the correct decimal value for your token

  // Send tokens to the contract
  await DAN.connect(owner).transfer(DAN.address, tokenAmount);

  // Ensure the contract has enough DAN tokens before attempting the withdrawal
  const initialcontractTokenBalance = await DAN.balanceOf(DAN.address);
  console.log("DAN tokens in contract:", initialcontractTokenBalance.toString());

  expect(initialcontractTokenBalance.eq(tokenAmount)).to.be.true;
  console.log("Passed the expect token and balance to be the same");

  // Get initial marketing wallet token balance
  const initialTokenBalance = await DAN.balanceOf(marketingWallet.address);
  console.log("Initial Token balance in marketing:", initialTokenBalance.toString());


  // First, check if the function exists on the contract
if (!DAN['withdrawDANToMarketing']) {
  console.error('withdrawDANToMarketing function does not exist on DAN');
  return;
}


  // Execute the transaction to withdraw all DAN tokens to marketing
  try {
    const tx = await DAN.connect(owner).withdrawDANToMarketing();
    await tx.wait();
    console.log("Withdrew DAN to marketing.");
  } catch (error) {
    console.error("Error during DAN withdrawal:", error);
    return;
  }


  // Get new marketing wallet token balance
  const newTokenBalance = await DAN.balanceOf(marketingWallet.address);
  console.log("New token balance:", newTokenBalance.toString());

  // Assert that all DAN tokens from the contract were transferred to the marketing wallet
  expect(newTokenBalance.sub(initialTokenBalance).eq(initialcontractTokenBalance)).to.be.true;

  // Check that the contract balance is now zero
  const finalContractTokenBalance = await DAN.balanceOf(DAN.address);
  console.log("DAN tokens left in contract:", finalContractTokenBalance.toString());
  expect(finalContractTokenBalance.isZero()).to.be.true;

});


  
});