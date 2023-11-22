# Vending Machine

[![Github Actions][gha-badge]][gha] [![Test Coverage][coverage-badge]][coverage] [![Hardhat][hardhat-badge]][hardhat]
[![License: MIT][license-badge]][license]

[gha]: https://github.com/gnosisguild/vending-machine/actions
[gha-badge]: https://github.com/gnosisguild/vending-machine/actions/workflows/ci.yml/badge.svg
[hardhat]: https://hardhat.org/
[hardhat-badge]: https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg
[license]: https://opensource.org/license/lgpl-3-0/
[license-badge]: https://img.shields.io/badge/License-LGPLV3-blue.svg
[coverage]: https://coveralls.io/github/gnosisguild/vending-machine?branch=main
[coverage-badge]: https://coveralls.io/repos/github/gnosisguild/vending-machine/badge.svg?branch=main&cache_bust=1

A simple contract allowing one to vend a token for a set rate against another token.

![Vending Machine](vending_machine.png)

## Features

Three variants of the vending machine contract are provided:

- **Mint**: mints the vended token on demand; requires the vending machine contract to have minting privileges on the
  token to be vended.
- **Transfer**: transfers vended tokens from the vending machine contract; requires the vending machine contract to hold
  a sufficient balance of the token to be vended.
- **TransferFrom**: transfers vended tokens from a third-party vendor; requires the vending machine contract to have a
  sufficient allowance of the token to be vended.

The vending machine contracts also include a `sweepTokens()` function, allowing the `owner` to sweep any ERC20 tokens
accidentally sent directly to the vending machine.

A vendable token contract is also provided, code for this was generated using
[wizard.openzeppelin.com](https://wizard.openzeppelin.com/).

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.

## License

This project is licensed under LGPLv3.
