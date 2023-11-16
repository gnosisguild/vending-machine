// SPDX-License-Identifier: LGPLv3
pragma solidity ^0.8.20;

import { VendingMachineBase, IERC20 } from "./VendingMachineBase.sol";

interface Mintable {
    function mint(address to, uint256 amount) external;
}

contract TransferFromVendingMachine is VendingMachineBase {
    address vendor;

    event VendorSet(address emitter, address vendor);

    constructor(
        address _owner,
        address _vendor,
        address _recipient,
        IERC20 _product,
        IERC20 _token,
        uint16 _productRatio,
        uint16 _tokenRatio
    ) VendingMachineBase(_owner, _recipient, _product, _token, _productRatio, _tokenRatio) {
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
        product.transferFrom(vendor, msg.sender, amount);
    }
}
