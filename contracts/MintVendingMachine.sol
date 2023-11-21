// SPDX-License-Identifier: LGPLv3
pragma solidity ^0.8.20;

import { VendingMachineBase, IERC20 } from "./VendingMachineBase.sol";
import { IMintableERC20 } from "./IMintableERC20.sol";

contract MintVendingMachine is VendingMachineBase {
    constructor(
        address _owner,
        address _recipient,
        IERC20 _outToken,
        IERC20 _inToken,
        uint16 _outTokenRatio,
        uint16 _inTokenRatio
    ) VendingMachineBase(_owner, _recipient, _outToken, _inToken, _outTokenRatio, _inTokenRatio) {}

    function _vend(uint256 amount) internal override {
        IMintableERC20(address(outToken)).mint(msg.sender, amount);
    }
}
