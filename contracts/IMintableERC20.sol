// SPDX-License-Identifier: LGPLv3
pragma solidity ^0.8.20;

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}
