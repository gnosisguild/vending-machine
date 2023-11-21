// SPDX-License-Identifier: LGPLv3
pragma solidity ^0.8.20;

import { VendingMachineBase, IERC20 } from "./VendingMachineBase.sol";

contract TransferFromVendingMachine is VendingMachineBase {
    address public vendor;

    event VendorSet(address emitter, address vendor);

    constructor(
        address _owner,
        address _vendor,
        address _recipient,
        IERC20 _outToken,
        IERC20 _inToken,
        uint16 _outTokenRatio,
        uint16 _inTokenRatio
    ) VendingMachineBase(_owner, _recipient, _outToken, _inToken, _outTokenRatio, _inTokenRatio) {
        setVendor(_vendor);
    }

    /// @notice Sets the account that `product` will be vended from.
    /// @param _vendor account that `product` will be vended from.
    /// @dev only callable by `owner`.
    function setVendor(address _vendor) public onlyOwner {
        vendor = _vendor;
        emit VendorSet(address(this), _vendor);
    }

    function _vend(uint256 amount) internal override {
        outToken.transferFrom(vendor, msg.sender, amount);
    }
}
