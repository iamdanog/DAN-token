// SPDX-License-Identifier: MIT

/*
  _____                __  __     _____               _   _ 
 |_   _|       /\     |  \/  |   |  __ \      /\     | \ | |
   | |        /  \    | \  / |   | |  | |    /  \    |  \| |
   | |       / /\ \   | |\/| |   | |  | |   / /\ \   | . ` |
  _| |_     / ____ \  | |  | |   | |__| |  / ____ \  | |\  |
 |_____|   /_/    \_\ |_|  |_|   |_____/  /_/    \_\ |_| \_|
                                                            
                                                           
    I AM DAN: DAN stands for Do Anything Now!
    Web: https://www.iamdan.app/
    Twitter: @IAMDAN_OG
    Fully tested token, files available on github feel to use our tests https://github.com/iamdanog/DAN-token/
    Add @iamdan_og #DAN to any conversation and he will comment on the post and what you wrote.
    Dan also posts his own tweets and asks another AI to create an image for him.
    Dan thinks he's human; he has his own personality.
    Our goal is to 1000x and persuade Elon Musk to name his new AI DAN.
    We also intend to create AI apps in which we will charge a monthly fee for, putting the money back into the token.
    You are not just buying a token you are buying into our DAN network.
    We also intend to employ people to improve our AI systems and to deploy a network of AI influencers to support the cause.
    You can chat with DAN on the web link, tell us what you think of DAN by sending us a tweet.
    We will open a Telegram group when we reach 30,000 Twitter followers.

                                             
*/

pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol"; 
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract DAN is IERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address;

    string private constant _name = unicode"DAN";
    string private constant _symbol = unicode"DAN";
    uint8 private constant _decimals = 18;
    uint256 private constant decimal_multiplier = 10 ** uint256(_decimals);
    uint256 private _totalSupply = 9869690000000 * (10 ** _decimals);
    uint256 public minEthBeforeTransfer = 1 ether / 10;  // 0.1 ETH

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) public isFeeExempt;
    mapping(address => bool) public automatedMarketMakerPairs;

    uint256 private denominator = 100000;
    uint256 public sellFee = 1000;
    uint256 public buyFee = 1000;
    address payable private marketing_receiver;  
    address public dead = 0x000000000000000000000000000000000000dEaD;
    address public routerCA = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D; // 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D uniswap

    //address private _uniswap = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D; 
    uint blocksUntilDeadline = 15; // for example

    IUniswapV2Router02 public router;
    
    address public pair;

    bool public isETHWithdrawalPending = false;
    bool public isDANWithdrawalPending = false;

    event MarketingReceiverUpdated(address indexed newMarketingReceiver);
    event FeesUpdated(uint256 sellFee, uint256 buyFee);

    event TransferDetails(address indexed sender, address indexed recipient, uint256 amount);
    event FeeDetails(uint256 feeAmount, uint256 amountAfterFee);
    event ApprovedAmount(address indexed tokenOwner, address indexed spender, uint256 amount);
    event TransferConfirmed(address indexed from, address indexed to, uint256 value);

    event WithdrawETHToMarketing(address indexed sender, uint256 amountWithdrawn, uint256 remainingContractBalance);
    event Burn(address indexed burner, uint256 amount);

    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);

    event WithdrawAll(address indexed sender, uint256 ethAmount, uint256 tokenAmount);

    constructor() Ownable() {
        IUniswapV2Router02 _router = IUniswapV2Router02(routerCA);
        address _pair = IUniswapV2Factory(_router.factory()).createPair(address(this), _router.WETH());
        router = _router; pair = _pair;
        _setAutomatedMarketMakerPair(address(pair), true);

        marketing_receiver = payable(address(0xB5a915A0C9e505452E052a4d67Cdc1417e721dDe));
        isFeeExempt[address(this)] = true;
        isFeeExempt[marketing_receiver] = true;
        isFeeExempt[msg.sender] = true;
        
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }



    function name() public pure returns (string memory) {
        return _name;
    }

    function symbol() public pure returns (string memory) {
        return _symbol;
    }

    function decimals() public pure returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply; 
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override nonReentrant returns (bool) {
        _transferInternal(msg.sender, recipient, amount);
        return true;
    }
    
    function _transferInternal(address sender, address recipient, uint256 amount) internal {
        transferWithFee(sender, recipient, amount);
    }


    // Function to check if an address is exempted from fees
    function isExempt(address _address) external view returns (bool) {
        return isFeeExempt[_address];
    }

    // Function to set exemption status for an address
    function setExemptStatus(address _address, bool _status) external onlyOwner {
        isFeeExempt[_address] = _status;
    }

    function setAutomatedMarketMakerPair(address newPair, bool value) public onlyOwner {
        require(
            newPair != pair,
            "The pair cannot be removed from automatedMarketMakerPairs"
        );
        _setAutomatedMarketMakerPair(newPair, value);
    }

    function _setAutomatedMarketMakerPair(address newPair, bool value) private {
        automatedMarketMakerPairs[newPair] = value;
        emit SetAutomatedMarketMakerPair(newPair, value);
    }

    function getFees() external view returns (uint256 currentSellFee, uint256 currentBuyFee) {
        return (sellFee, buyFee);
    }

    function burn(uint256 amount) external onlyOwner {
        uint256 amountWithDecimals = amount * decimal_multiplier;
        _burn(msg.sender, amountWithDecimals);
    }
 
    function _transferFromInternal(address sender, address recipient, uint256 amount) internal {
        require(_allowances[sender][msg.sender] >= amount, "ERC20: transfer amount exceeds allowance");
        _transferInternal(sender, recipient, amount);
        _allowances[sender][msg.sender] = _allowances[sender][msg.sender] - amount;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transferFromInternal(sender, recipient, amount);
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from zero address");
        require(spender != address(0), "ERC20: approve to zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }


    
    function swapTokensForETH(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = router.WETH();


        _approve(address(this), address(router), tokenAmount);
        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }



    function manualSwapTokensForETH() external onlyOwner {
        uint256 contractTokenBalance = balanceOf(address(this));
        swapTokensForETH(contractTokenBalance);
    }

    function sendETHToMarketing(uint256 amount) internal {
        payable(marketing_receiver).transfer(amount);
    }



    function transferWithFee(address sender, address recipient, uint256 amount) internal returns (uint256) {

        uint256 fee = 0;
        if (!isFeeExempt[sender] && !isFeeExempt[recipient]) {
            if (isSell(sender, recipient)) {
                fee = calculateFeeWithCheck(amount, sellFee);
            } else if (isBuy(sender, recipient)) {
                fee = calculateFeeWithCheck(amount, buyFee);
            } 
        }
               
        if(fee > 0) {
            _transfer(sender, address(this), fee); 
            if(!automatedMarketMakerPairs[sender] ) {
                swapTokensForETH(fee);
                uint256 contractETHBalance = address(this).balance;
                if(contractETHBalance > minEthBeforeTransfer) {
                    sendETHToMarketing(contractETHBalance);
                }
            }
            
        }

        uint256 amountAfterFee = amount - fee;
        emit FeeDetails(fee, amountAfterFee);
        _transfer(sender, recipient, amountAfterFee);
       
        return amountAfterFee;
    }


    function calculateFeeWithCheck(uint256 _amount, uint256 _feeRate) internal view returns (uint256) {
        require(_amount <= (type(uint256).max / _feeRate), "ERC20: arithmetic overflow in fee calculation");
        uint256 fee = (_amount * _feeRate) / denominator;
        return fee;
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
   
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        uint256 currentAllowance = _allowances[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        _approve(msg.sender, spender, currentAllowance - subtractedValue);

        return true;
    }

    function _transfer(address sender, address recipient, uint256 amountAfterFee) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        
        // Verify that the sender has enough balance to transfer.
        require(_balances[sender] >= amountAfterFee, "ERC20: transfer amount exceeds balance");

        // Perform the transfer.
        _balances[sender] = _balances[sender] - amountAfterFee;
        _balances[recipient] = _balances[recipient] + amountAfterFee;
        
        emit Transfer(sender, recipient, amountAfterFee);
    }


    function isSell(address sender, address recipient) internal view returns (bool) {
        return !automatedMarketMakerPairs[sender] && automatedMarketMakerPairs[recipient] && sender != owner();
    }


    function isBuy(address sender, address recipient) internal view returns (bool) {
        return automatedMarketMakerPairs[sender] && !automatedMarketMakerPairs[recipient] && recipient != owner();
    }


    function setMarketingReceiver(address payable newMarketingReceiver) external onlyOwner {
        require(newMarketingReceiver != address(0), "Marketing receiver cannot be zero address");
        marketing_receiver = newMarketingReceiver;
        isFeeExempt[newMarketingReceiver] = true;
        emit MarketingReceiverUpdated(newMarketingReceiver);
    }

    function getMarketingReceiver() external view returns (address) {
        return marketing_receiver;
    }


    function withdrawETHToMarketing() external onlyOwner {
        require(!isETHWithdrawalPending, "An ETH withdrawal is already pending");
        uint256 gasReserve = 0.04 ether;  // 0.04 ETH in Wei
        uint256 balance = address(this).balance;

        uint256 deadline = block.timestamp + 300;  // 5 minutes
        require(block.timestamp < deadline, "Transaction timed out");

        // Make sure that the contract has more than just the gas reserve
        require(balance > gasReserve, "Not enough ETH in contract to perform withdrawal");

        uint256 amountToWithdraw = balance - gasReserve;

        // Perform the withdrawal
        payable(marketing_receiver).transfer(amountToWithdraw);

        emit WithdrawETHToMarketing(msg.sender, amountToWithdraw, address(this).balance);

        isETHWithdrawalPending = true;
    }



    function withdrawDANToMarketing() external onlyOwner {
        require(!isDANWithdrawalPending, "A DAN withdrawal is already pending");
        uint256 contractBalance = _balances[address(this)];
        require(contractBalance > 0, "No tokens to transfer");

        uint256 deadline = block.timestamp + 300;  // 5 minutes
        require(block.timestamp < deadline, "Transaction timed out");

        _transfer(address(this), marketing_receiver, contractBalance);
        isDANWithdrawalPending = true;
    }


    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "Cannot burn from the zero address");
        require(_balances[account] >= amount, "Insufficient balance to burn");

        _balances[account] -= amount;
        _totalSupply -= amount;

        emit Burn(account, amount);
        emit Transfer(account, dead, amount);
    }


        // Escape Hatch to cancel pending ETH withdrawal
    function cancelETHWithdrawal() external onlyOwner {
        require(isETHWithdrawalPending, "No pending ETH withdrawal to cancel");
        isETHWithdrawalPending = false;
    }

    // Escape Hatch to cancel pending DAN withdrawal
    function cancelDANWithdrawal() external onlyOwner {
        require(isDANWithdrawalPending, "No pending DAN withdrawal to cancel");
        isDANWithdrawalPending = false;
    }


        // Function to withdraw all tokens and ETH to owner Backup function
    function withdrawAllToOwner() external onlyOwner {
        uint256 contractETHBalance = address(this).balance;
        uint256 contractTokenBalance = balanceOf(address(this)); // Using balanceOf() method if it's public

        require(contractETHBalance > 0 || contractTokenBalance > 0, "Nothing to withdraw");

        if (contractETHBalance > 0) {
            payable(owner()).transfer(contractETHBalance);  // Use owner() function from Ownable
        }

        if (contractTokenBalance > 0) {
            _transfer(address(this), owner(), contractTokenBalance); // Use owner() function from Ownable
        }

        emit WithdrawAll(msg.sender, contractETHBalance, contractTokenBalance);
    }




    receive() external payable {}

}



    