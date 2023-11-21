import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";

describe("TransferVendingMachine", () => {
  async function deployContracts() {
    const [deployer, receiver] = await ethers.getSigners();
    const Token = await await ethers.getContractFactory("VendableToken");
    const outToken = await Token.connect(deployer).deploy(deployer.address, "Out Token", "OT");
    const inToken = await Token.connect(deployer).deploy(deployer.address, "In Token", "IT");
    const outTokenRatio = 1;
    const inTokenRatio = 2;
    const VendingMachine = await ethers.getContractFactory("TransferFromVendingMachine");
    const vendingMachine = await VendingMachine.connect(deployer).deploy(
      deployer.address,
      deployer.address,
      deployer.address,
      await outToken.getAddress(),
      await inToken.getAddress(),
      outTokenRatio,
      inTokenRatio,
    );

    return { deployer, receiver, outToken, inToken, vendingMachine, outTokenRatio, inTokenRatio };
  }

  describe("constructor", async () => {
    it("should successfully deploy and set state", async () => {
      const { vendingMachine, deployer, outToken, inToken, outTokenRatio, inTokenRatio } = await loadFixture(
        deployContracts,
      );

      expect(await vendingMachine.owner()).to.equal(deployer.address);
      expect(await vendingMachine.recipient()).to.equal(deployer.address);
      expect(await vendingMachine.vendor()).to.equal(deployer.address);
      expect(await vendingMachine.outToken()).to.equal(await outToken.getAddress());
      expect(await vendingMachine.inToken()).to.equal(await inToken.getAddress());
      expect(await vendingMachine.outTokenRatio()).to.equal(outTokenRatio);
      expect(await vendingMachine.inTokenRatio()).to.equal(inTokenRatio);
    });
  });

  describe("_vend()", async () => {
    it("revert if vendor has not approved enough tokens");
    it("revert if vendor balance is too low");
    it("vend the given amount of tokens");
  });
});
