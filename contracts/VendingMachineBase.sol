// SPDX-License-Identifier: LGPLv3
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20, SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract VendingMachineBase is Ownable {
    using SafeERC20 for IERC20;

    address public recipient;
    IERC20 public outToken;
    IERC20 public inToken;
    uint16 public outTokenRatio;
    uint16 public inTokenRatio;

    event RecipientSet(address emitter, address recipient);
    event OutTokenSet(address emitter, IERC20 outToken);
    event InTokenSet(address emitter, IERC20 inToken);
    event RatioSet(address emitter, uint16 outTokenRatio, uint16 inTokenRatio);
    event VendingReciept(address emitter, address indexed buyer, uint256 spent, uint256 vended);
    event TokensSwept(address emitter, IERC20[] tokens, uint256[] amountsSwept);

    error RatioCannotBeZero(uint16 _outTokenRatio, uint16 _inTokenRatio);
    error TokenAddressCannotBeZero();

    constructor(
        address _owner,
        address _recipient,
        IERC20 _outToken,
        IERC20 _inToken,
        uint16 _outTokenRatio,
        uint16 _inTokenRatio
    ) Ownable(_owner) {
        setRecipient(_recipient);
        setOutToken(_outToken);
        setInToken(_inToken);
        setRatio(_outTokenRatio, _inTokenRatio);
    }

    function _vend(uint256 amount) internal virtual;

    /// @notice Purchase `amount` worth of `outToken` from the vending machine.
    /// @param amount `amount` of `tokens` to spend on `outToken`.
    function vend(uint256 amount) public returns (uint256 amountVended) {
        inToken.transferFrom(msg.sender, recipient, amount);
        amountVended = (amount * outTokenRatio) / inTokenRatio;
        _vend(amountVended);
        emit VendingReciept(address(this), msg.sender, amount, amountVended);
    }

    /// @notice sets the account which will receive `token`.
    /// @param _recipient account to receive `token`.
    /// @dev only callable by `owner`.
    function setRecipient(address _recipient) public onlyOwner {
        recipient = _recipient;
        emit RecipientSet(address(this), _recipient);
    }

    /// @notice sets the `outToken` to be vended.
    /// @param _outToken address of `outToken`.
    /// @dev only callable by `owner`.
    function setOutToken(IERC20 _outToken) public onlyOwner {
        if (_outToken == IERC20(address(0))) revert TokenAddressCannotBeZero();
        outToken = _outToken;
        emit OutTokenSet(address(this), _outToken);
    }

    /// @notice sets the `token` used for vending.
    /// @param _inToken address of `token`.
    /// @dev only callable by `owner`.
    function setInToken(IERC20 _inToken) public onlyOwner {
        if (_inToken == IERC20(address(0))) revert TokenAddressCannotBeZero();
        inToken = _inToken;
        emit InTokenSet(address(this), _inToken);
    }

    /// @notice sets the outToken to token ratio.
    /// @param _outTokenRatio value to be set to `outTokenRatio`.
    /// @param _inTokenRatio value to be set to `inTokenRatio`.
    /// @dev only callable by `owner`.
    function setRatio(uint16 _outTokenRatio, uint16 _inTokenRatio) public onlyOwner {
        if (_outTokenRatio == 0 || _inTokenRatio == 0) revert RatioCannotBeZero(_outTokenRatio, _inTokenRatio);
        outTokenRatio = _outTokenRatio;
        inTokenRatio = _inTokenRatio;
        emit RatioSet(address(this), _outTokenRatio, _inTokenRatio);
    }

    function sweepTokens(IERC20[] memory tokens) public onlyOwner returns (uint256[] memory amountsSwept) {
        for (uint256 i = 0; i < tokens.length; i++) {
            amountsSwept[i] = tokens[i].balanceOf(address(this));
            tokens[i].safeTransfer(recipient, amountsSwept[i]);
        }
        emit TokensSwept(address(this), tokens, amountsSwept);
    }
}
