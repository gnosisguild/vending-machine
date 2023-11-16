// SPDX-License-Identifier: LGPLv3
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20, SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract VendingMachineBase is Ownable {
    using SafeERC20 for IERC20;

    address public recipient;
    IERC20 public product;
    IERC20 public token;
    uint16 public productRatio;
    uint16 public tokenRatio;

    event RecipientSet(address emitter, address recipient);
    event ProductSet(address emitter, IERC20 product);
    event TokenSet(address emitter, IERC20 token);
    event RatioSet(address emitter, uint16 productRatio, uint16 tokenRatio);

    error RatioCannotBeZero(uint16 _productRatio, uint16 _tokenRatio);

    constructor(
        address _owner,
        address _recipient,
        IERC20 _product,
        IERC20 _token,
        uint16 _productRatio,
        uint16 _tokenRatio
    ) Ownable(_owner) {
        setRecipient(_recipient);
        setProduct(_product);
        setToken(_token);
        setRatio(_productRatio, _tokenRatio);
    }

    function _vend(uint256 amount) internal virtual;

    /// @notice Purchase `amount` worth of `product` from the vending machine.
    /// @param amount `amount` of `tokens` to spend on `product`.
    function vend(uint256 amount) public returns (uint256 amountMinted) {
        token.transferFrom(msg.sender, recipient, amount);

        uint256 amountToMint;
        if (productRatio == tokenRatio) {
            amountToMint = amount;
            _vend(amountToMint);
            return (amountToMint);
        }

        uint16 ratioSum = productRatio + tokenRatio;

        if (productRatio > tokenRatio) {
            amountToMint = (amount * ratioSum) / productRatio;
            _vend(amountToMint);
        } else {
            amountToMint = (amount * ratioSum) / tokenRatio;
            _vend(amountToMint);
        }
    }

    /// @notice sets the account which will receive `token`.
    /// @param _recipient account to receive `token`.
    /// @dev only callable by `owner`.
    function setRecipient(address _recipient) public onlyOwner {
        recipient = _recipient;
        emit RecipientSet(address(this), _recipient);
    }

    /// @notice sets the `product` to be vended.
    /// @param _product address of `product`.
    /// @dev only callable by `owner`.
    function setProduct(IERC20 _product) public onlyOwner {
        product = _product;
        emit ProductSet(address(this), _product);
    }

    /// @notice sets the `token` used for vending.
    /// @param _token address of `token`.
    /// @dev only callable by `owner`.
    function setToken(IERC20 _token) public onlyOwner {
        token = _token;
        emit TokenSet(address(this), _token);
    }

    /// @notice sets the product to token ratio.
    /// @param _productRatio value to be set to `productRatio`.
    /// @param _tokenRatio value to be set to `tokenRatio`.
    /// @dev only callable by `owner`.
    function setRatio(uint16 _productRatio, uint16 _tokenRatio) public onlyOwner {
        if (_productRatio == 0 || _tokenRatio == 0) revert RatioCannotBeZero(_productRatio, _tokenRatio);
        productRatio = _productRatio;
        tokenRatio = _tokenRatio;
        emit RatioSet(address(this), _productRatio, _tokenRatio);
    }
}
