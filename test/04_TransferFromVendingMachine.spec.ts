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
    it("revert if vendor has not approved enough tokens", async () => {
      const { vendingMachine, deployer, inToken, outTokenRatio, inTokenRatio } = await loadFixture(deployContracts);
      const amountToSpend = ethers.parseEther("1");
      const expectedOutput = (amountToSpend * ethers.toBigInt(outTokenRatio)) / ethers.toBigInt(inTokenRatio);

      await inToken.mint(deployer.address, amountToSpend);
      await inToken.approve(await vendingMachine.getAddress(), amountToSpend);

      await expect(vendingMachine.vend(amountToSpend))
        .to.be.revertedWithCustomError(inToken, "ERC20InsufficientAllowance")
        .withArgs(await vendingMachine.getAddress(), 0, expectedOutput);
    });
    it("revert if vendor balance is too low", async () => {
      const { vendingMachine, deployer, inToken, outToken, outTokenRatio, inTokenRatio } = await loadFixture(
        deployContracts,
      );
      const amountToSpend = ethers.parseEther("1");
      const amountToMint = ethers.parseEther("0.1");
      const expectedOutput = (amountToSpend * ethers.toBigInt(outTokenRatio)) / ethers.toBigInt(inTokenRatio);

      await inToken.mint(deployer.address, amountToSpend);
      await inToken.approve(await vendingMachine.getAddress(), amountToSpend);
      await outToken.mint(deployer.address, amountToMint);
      await outToken.approve(await vendingMachine.getAddress(), amountToSpend);

      await expect(vendingMachine.vend(amountToSpend))
        .to.be.revertedWithCustomError(inToken, "ERC20InsufficientBalance")
        .withArgs(deployer.address, amountToMint, expectedOutput);
    });
    it("vend the given amount of tokens", async () => {
      const { vendingMachine, deployer, receiver, outToken, inToken, inTokenRatio, outTokenRatio } = await loadFixture(
        deployContracts,
      );
      const amountToSpend = ethers.parseEther("1");
      const amountToMint = ethers.parseEther("1");
      const expectedOutput = (amountToSpend * ethers.toBigInt(outTokenRatio)) / ethers.toBigInt(inTokenRatio);

      await inToken.mint(receiver.address, amountToSpend);
      await inToken.connect(receiver).approve(await vendingMachine.getAddress(), amountToSpend);
      await outToken.mint(deployer.address, amountToMint);
      await outToken.approve(await vendingMachine.getAddress(), amountToMint);

      expect(await outToken.balanceOf(receiver.address)).to.equal(0);
      expect(await outToken.balanceOf(deployer.address)).to.equal(amountToMint);
      expect(await vendingMachine.connect(receiver).vend(amountToSpend));
      expect(await outToken.balanceOf(receiver.address)).to.equal(expectedOutput);
      expect(await outToken.balanceOf(deployer.address)).to.equal(amountToMint - expectedOutput);
    });
  });

  describe("setVendor()", async () => {
    it("revert if not called by owner", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(vendingMachine.connect(receiver).setVendor(receiver.address))
        .to.be.revertedWithCustomError(vendingMachine, "OwnableUnauthorizedAccount")
        .withArgs(receiver.address);
    });
    it("set vendor to given address", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      expect(await vendingMachine.setVendor(receiver.address));
      expect(await vendingMachine.vendor()).to.equal(receiver.address);
    });
    it("emit VendorSet", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(await vendingMachine.setVendor(receiver.address))
        .to.emit(vendingMachine, "VendorSet")
        .withArgs(await vendingMachine.getAddress(), receiver.address);
    });
  });
});
