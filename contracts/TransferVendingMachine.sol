// SPDX-License-Identifier: LGPLv3
pragma solidity ^0.8.20;

import { VendingMachineBase, IERC20 } from "./VendingMachineBase.sol";

contract TransferVendingMachine is VendingMachineBase {
    constructor(
        address _owner,
        address _recipient,
        IERC20 _product,
        IERC20 _token,
        uint16 _productRatio,
        uint16 _tokenRatio
    ) VendingMachineBase(_owner, _recipient, _product, _token, _productRatio, _tokenRatio) {}

    function _vend(uint256 amount) internal override {
        product.transfer(msg.sender, amount);
    }
}
