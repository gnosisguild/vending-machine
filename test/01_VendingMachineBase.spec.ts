import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import exp from "constants";
import { ethers } from "hardhat";

const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";

describe("VendingMachineBase", () => {
  async function deployContracts() {
    const [deployer, receiver] = await ethers.getSigners();
    const Token = await await ethers.getContractFactory("VendableToken");
    const outToken = await Token.connect(deployer).deploy(deployer.address, "Out Token", "OT");
    const inToken = await Token.connect(deployer).deploy(deployer.address, "In Token", "IT");
    const outTokenRatio = 1;
    const inTokenRatio = 2;
    const VendingMachine = await ethers.getContractFactory("MintVendingMachine");
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

  describe("vend()", async () => {
    it("revert if sender does not have enough tokens", async () => {
      const { vendingMachine, deployer, outToken, inToken } = await loadFixture(deployContracts);
      const amountToSpend = ethers.parseEther("2");
      const amountToMint = ethers.parseEther("1");

      await outToken.transferOwnership(vendingMachine.getAddress());
      await inToken.mint(deployer.address, amountToMint);
      await inToken.approve(await vendingMachine.getAddress(), amountToSpend);

      await expect(vendingMachine.vend(ethers.parseEther("2")))
        .to.be.revertedWithCustomError(inToken, "ERC20InsufficientBalance")
        .withArgs(await vendingMachine.getAddress, amountToMint, amountToSpend);
    });
    it("revert if sender has not approved enough tokens", async () => {
      const { vendingMachine, deployer, outToken, inToken } = await loadFixture(deployContracts);
      const amountToSpend = ethers.parseEther("2");
      const amountToMint = ethers.parseEther("1");

      await outToken.transferOwnership(vendingMachine.getAddress());
      await inToken.mint(deployer.address, amountToMint);

      await expect(vendingMachine.vend(amountToSpend))
        .to.be.revertedWithCustomError(inToken, "ERC20InsufficientAllowance")
        .withArgs(await vendingMachine.getAddress(), 0, amountToSpend);
    });
    it("vend the given amount of tokens", async () => {
      const { vendingMachine, deployer, outToken, inToken, inTokenRatio, outTokenRatio } = await loadFixture(
        deployContracts,
      );
      const amountToSpend = ethers.parseEther("1");
      const amountToMint = ethers.parseEther("1");
      const expectedOutput = (amountToSpend * ethers.toBigInt(outTokenRatio)) / ethers.toBigInt(inTokenRatio);

      await outToken.transferOwnership(vendingMachine.getAddress());
      await inToken.mint(deployer.address, amountToMint);
      await inToken.approve(await vendingMachine.getAddress(), amountToSpend);

      expect(await vendingMachine.vend(amountToSpend));
      expect(await outToken.balanceOf(deployer.address)).to.equal(expectedOutput);
    });
    it("emit VendingReceipt", async () => {
      const { vendingMachine, deployer, outToken, inToken, inTokenRatio, outTokenRatio } = await loadFixture(
        deployContracts,
      );
      const amountToSpend = ethers.parseEther("1");
      const amountToMint = ethers.parseEther("1");
      const expectedOutput = (amountToSpend * ethers.toBigInt(outTokenRatio)) / ethers.toBigInt(inTokenRatio);

      await outToken.transferOwnership(vendingMachine.getAddress());
      await inToken.mint(deployer.address, amountToMint);
      await inToken.approve(await vendingMachine.getAddress(), amountToSpend);

      await expect(await vendingMachine.vend(amountToSpend))
        .to.emit(vendingMachine, "VendingReciept")
        .withArgs(await vendingMachine.getAddress(), deployer.address, amountToSpend, expectedOutput);
    });
  });

  describe("setRecipient()", async () => {
    it("revert if not called by owner", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(vendingMachine.connect(receiver).setRecipient(receiver.address))
        .to.be.revertedWithCustomError(vendingMachine, "OwnableUnauthorizedAccount")
        .withArgs(receiver.address);
    });
    it("set recipient to given address", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      expect(await vendingMachine.setRecipient(receiver.address));
      expect(await vendingMachine.recipient()).to.equal(receiver.address);
    });
    it("emit RecipientSet", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(await vendingMachine.setRecipient(receiver.address))
        .to.emit(vendingMachine, "RecipientSet")
        .withArgs(await vendingMachine.getAddress(), receiver.address);
    });
  });

  describe("setOutToken()", async () => {
    it("revert if not called by owner", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(vendingMachine.connect(receiver).setOutToken(receiver.address))
        .to.be.revertedWithCustomError(vendingMachine, "OwnableUnauthorizedAccount")
        .withArgs(receiver.address);
    });
    it("revert if set to address(0)", async () => {
      const { vendingMachine } = await loadFixture(deployContracts);

      await expect(vendingMachine.setOutToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        vendingMachine,
        "TokenAddressCannotBeZero",
      );
    });
    it("set outToken to given address", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      expect(await vendingMachine.setOutToken(receiver.address));
      expect(await vendingMachine.outToken()).to.equal(receiver.address);
    });
    it("emit OutTokenSet", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(await vendingMachine.setOutToken(receiver.address))
        .to.emit(vendingMachine, "OutTokenSet")
        .withArgs(await vendingMachine.getAddress(), receiver.address);
    });
  });

  describe("setInToken()", async () => {
    it("revert if not called by owner", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(vendingMachine.connect(receiver).setInToken(receiver.address))
        .to.be.revertedWithCustomError(vendingMachine, "OwnableUnauthorizedAccount")
        .withArgs(receiver.address);
    });
    it("revert if set to address(0)", async () => {
      const { vendingMachine } = await loadFixture(deployContracts);

      await expect(vendingMachine.setInToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        vendingMachine,
        "TokenAddressCannotBeZero",
      );
    });
    it("set inToken to given address", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      expect(await vendingMachine.setInToken(receiver.address));
      expect(await vendingMachine.inToken()).to.equal(receiver.address);
    });
    it("emit InTokenSet", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(await vendingMachine.setInToken(receiver.address))
        .to.emit(vendingMachine, "InTokenSet")
        .withArgs(await vendingMachine.getAddress(), receiver.address);
    });
  });

  describe("setRatio()", async () => {
    it("revert if not called by owner", async () => {
      const { vendingMachine, receiver } = await loadFixture(deployContracts);

      await expect(vendingMachine.connect(receiver).setRatio(20, 30))
        .to.be.revertedWithCustomError(vendingMachine, "OwnableUnauthorizedAccount")
        .withArgs(receiver.address);
    });
    it("revert if either ratio is set to 0", async () => {
      const { vendingMachine } = await loadFixture(deployContracts);

      await expect(vendingMachine.setRatio(0, 30))
        .to.be.revertedWithCustomError(vendingMachine, "RatioCannotBeZero")
        .withArgs(await vendingMachine.getAddress(), 0, 30);

      await expect(vendingMachine.setRatio(20, 0))
        .to.be.revertedWithCustomError(vendingMachine, "RatioCannotBeZero")
        .withArgs(await vendingMachine.getAddress(), 20, 0);
    });
    it("set ratios to given values", async () => {
      const { vendingMachine } = await loadFixture(deployContracts);

      expect(await vendingMachine.setRatio(20, 30));
      expect(await vendingMachine.outTokenRatio()).to.equal(20);
      expect(await vendingMachine.inTokenRatio()).to.equal(30);
    });
    it("emit RatioSet", async () => {
      const { vendingMachine } = await loadFixture(deployContracts);

      await expect(await vendingMachine.setRatio(20, 30))
        .to.emit(vendingMachine, "RatioSet")
        .withArgs(await vendingMachine.getAddress(), 20, 30);
    });
  });

  describe.only("sweepTokens()", async () => {
    it("revert if not called by owner", async () => {
      const { vendingMachine, receiver, inToken } = await loadFixture(deployContracts);

      await expect(vendingMachine.connect(receiver).sweepTokens([await inToken.getAddress()]))
        .to.be.revertedWithCustomError(vendingMachine, "OwnableUnauthorizedAccount")
        .withArgs(receiver.address);
    });
    it("sweep full balance of given tokens", async () => {
      const { vendingMachine, inToken, outToken, deployer } = await loadFixture(deployContracts);
      const amountToMint = ethers.parseEther("1");

      await inToken.mint(await vendingMachine.getAddress(), amountToMint);
      await outToken.mint(await vendingMachine.getAddress(), amountToMint);
      expect(await vendingMachine.sweepTokens([await inToken.getAddress(), await outToken.getAddress()]));
      expect(await inToken.balanceOf(await vendingMachine.getAddress())).to.equal(0);
      expect(await outToken.balanceOf(await vendingMachine.getAddress())).to.equal(0);
      expect(await inToken.balanceOf(deployer.address)).to.equal(amountToMint);
      expect(await outToken.balanceOf(deployer.address)).to.equal(amountToMint);
    });
    it("returns amounts swept", async () => {
      const { vendingMachine, inToken, outToken } = await loadFixture(deployContracts);
      const amountToMint = ethers.parseEther("1");

      await inToken.mint(await vendingMachine.getAddress(), amountToMint);
      await outToken.mint(await vendingMachine.getAddress(), amountToMint);
      expect(
        await vendingMachine.sweepTokens.staticCall([await inToken.getAddress(), await outToken.getAddress()]),
      ).to.deep.equal([amountToMint, amountToMint]);
    });
    it("emit TokensSwept", async () => {
      const { vendingMachine, inToken, outToken } = await loadFixture(deployContracts);
      const amountToMint = ethers.parseEther("1");

      await inToken.mint(await vendingMachine.getAddress(), amountToMint);
      await outToken.mint(await vendingMachine.getAddress(), amountToMint);
      await expect(await vendingMachine.sweepTokens([await inToken.getAddress(), await outToken.getAddress()]))
        .to.emit(vendingMachine, "TokensSwept")
        .withArgs(
          await vendingMachine.getAddress(),
          [await inToken.getAddress(), await outToken.getAddress()],
          [amountToMint, amountToMint],
        );
    });
  });
});
