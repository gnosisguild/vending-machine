import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TransferVendingMachine", () => {
  async function deployContracts() {
    const [deployer, receiver] = await ethers.getSigners();
    const Token = await await ethers.getContractFactory("VendableToken");
    const outToken = await Token.connect(deployer).deploy(
      deployer.address,
      deployer.address,
      deployer.address,
      "Out Token",
      "OT",
    );
    const inToken = await Token.connect(deployer).deploy(
      deployer.address,
      deployer.address,
      deployer.address,
      "In Token",
      "IT",
    );
    const outTokenRatio = 1;
    const inTokenRatio = 2;
    const VendingMachine = await ethers.getContractFactory("TransferVendingMachine");
    const vendingMachine = await VendingMachine.connect(deployer).deploy(
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
      expect(await vendingMachine.outToken()).to.equal(await outToken.getAddress());
      expect(await vendingMachine.inToken()).to.equal(await inToken.getAddress());
      expect(await vendingMachine.outTokenRatio()).to.equal(outTokenRatio);
      expect(await vendingMachine.inTokenRatio()).to.equal(inTokenRatio);
    });
  });

  describe("_vend()", async () => {
    it("revert if vending machine does not have enough tokens", async () => {
      const { vendingMachine, deployer, inToken, outToken, outTokenRatio, inTokenRatio } = await loadFixture(
        deployContracts,
      );
      const amountToSpend = ethers.parseEther("3");
      const amountToMint = ethers.parseEther("1");
      const expectedOutput = (amountToSpend * ethers.toBigInt(outTokenRatio)) / ethers.toBigInt(inTokenRatio);

      await inToken.mint(deployer.address, amountToSpend);
      await inToken.approve(await vendingMachine.getAddress(), amountToSpend);
      await outToken.mint(await vendingMachine.getAddress(), amountToMint);

      await expect(vendingMachine.vend(amountToSpend))
        .to.be.revertedWithCustomError(inToken, "ERC20InsufficientBalance")
        .withArgs(await vendingMachine.getAddress(), amountToMint, expectedOutput);
    });
    it("vend the given amount of tokens", async () => {
      const { vendingMachine, deployer, outToken, inToken, inTokenRatio, outTokenRatio } = await loadFixture(
        deployContracts,
      );
      const amountToSpend = ethers.parseEther("1");
      const amountToMint = ethers.parseEther("1");
      const expectedOutput = (amountToSpend * ethers.toBigInt(outTokenRatio)) / ethers.toBigInt(inTokenRatio);

      await inToken.mint(deployer.address, amountToMint);
      await inToken.approve(await vendingMachine.getAddress(), amountToSpend);
      await outToken.mint(await vendingMachine.getAddress(), amountToMint);

      expect(await outToken.balanceOf(deployer.address)).to.equal(0);
      expect(await vendingMachine.vend(amountToSpend));
      expect(await outToken.balanceOf(deployer.address)).to.equal(expectedOutput);
    });
  });
});
