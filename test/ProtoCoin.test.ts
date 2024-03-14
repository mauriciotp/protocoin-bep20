import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('ProtoCoin', function () {
  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const ProtoCoin = await ethers.getContractFactory('ProtoCoin');
    const protoCoin = await ProtoCoin.deploy();

    return { protoCoin, owner, otherAccount };
  }

  it('Should have correct name', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const name = await protoCoin.name();
    expect(name).to.equal('New ProtoCoin');
  });

  it('Should have correct symbol', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const symbol = await protoCoin.symbol();
    expect(symbol).to.equal('NPC');
  });

  it('Should have correct decimals', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const decimals = await protoCoin.decimals();
    expect(decimals).to.equal(18);
  });

  it('Should have correct totalSupply', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const totalSupply = await protoCoin.totalSupply();
    expect(totalSupply).to.equal(1000n * 10n ** 18n);
  });

  it('Should get balance', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const balance = await protoCoin.balanceOf(owner.address);
    expect(balance).to.equal(1000n * 10n ** 18n);
  });

  it('Should transfer', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const balanceOwnerBefore = await protoCoin.balanceOf(owner.address);
    const balanceOtherBefore = await protoCoin.balanceOf(otherAccount.address);

    await protoCoin.transfer(otherAccount.address, 1n);

    const balanceOwnerAfter = await protoCoin.balanceOf(owner.address);
    const balanceOtherAfter = await protoCoin.balanceOf(otherAccount.address);

    expect(balanceOwnerBefore).to.equal(1000n * 10n ** 18n);
    expect(balanceOwnerAfter).to.equal(1000n * 10n ** 18n - 1n);
    expect(balanceOtherBefore).to.equal(0);
    expect(balanceOtherAfter).to.equal(1);
  });

  it('Should NOT transfer', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const instance = protoCoin.connect(otherAccount);
    await expect(
      instance.transfer(owner.address, 1n)
    ).to.be.revertedWithCustomError(protoCoin, 'ERC20InsufficientBalance');
  });

  it('Should approve', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    await protoCoin.approve(otherAccount, 1n);

    const value = await protoCoin.allowance(
      owner.address,
      otherAccount.address
    );
    expect(value).to.equal(1);
  });

  it('Should transfer from', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const balanceOwnerBefore = await protoCoin.balanceOf(owner.address);
    const balanceOtherBefore = await protoCoin.balanceOf(otherAccount.address);

    await protoCoin.approve(otherAccount.address, 10n);

    const instance = protoCoin.connect(otherAccount);
    await instance.transferFrom(owner.address, otherAccount.address, 5n);

    const balanceOwnerAfter = await protoCoin.balanceOf(owner.address);
    const balanceOtherAfter = await protoCoin.balanceOf(otherAccount.address);
    const allowance = await protoCoin.allowance(owner, otherAccount);

    expect(balanceOwnerBefore).to.equal(1000n * 10n ** 18n);
    expect(balanceOwnerAfter).to.equal(1000n * 10n ** 18n - 5n);
    expect(balanceOtherBefore).to.equal(0);
    expect(balanceOtherAfter).to.equal(5);
    expect(allowance).to.equal(5);
  });

  it('Should NOT transfer from (balance)', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const instance = protoCoin.connect(otherAccount);
    await instance.approve(owner.address, 1n);

    await expect(
      protoCoin.transferFrom(otherAccount.address, owner.address, 1n)
    ).to.be.revertedWithCustomError(protoCoin, 'ERC20InsufficientBalance');
  });

  it('Should NOT transfer from (allowance)', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const instance = protoCoin.connect(otherAccount);
    await expect(
      instance.transferFrom(owner.address, otherAccount.address, 1n)
    ).to.be.revertedWithCustomError(protoCoin, 'ERC20InsufficientAllowance');
  });

  it('Should mint once', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const mintAmount = 1000n;
    await protoCoin.setMintAmount(mintAmount);

    const balanceBefore = await protoCoin.balanceOf(otherAccount.address);

    const instance = protoCoin.connect(otherAccount);
    await instance.mint();

    const balanceAfter = await protoCoin.balanceOf(otherAccount.address);
    expect(balanceAfter).to.equal(balanceBefore + mintAmount);
  });

  it('Should mint twice (different accounts)', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const mintAmount = 1000n;
    await protoCoin.setMintAmount(mintAmount);

    const balanceBefore = await protoCoin.balanceOf(owner.address);
    await protoCoin.mint();

    const instance = protoCoin.connect(otherAccount);
    await instance.mint();

    const balanceAfter = await protoCoin.balanceOf(owner.address);
    expect(balanceAfter).to.equal(balanceBefore + mintAmount);
  });

  it('Should mint twice (different moments)', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const mintAmount = 1000n;
    await protoCoin.setMintAmount(mintAmount);

    const balanceBefore = await protoCoin.balanceOf(owner.address);
    await protoCoin.mint();

    const mintDelay = 60 * 60 * 24 * 2; //2 days in seconds
    await time.increase(mintDelay);

    await protoCoin.mint();

    const balanceAfter = await protoCoin.balanceOf(owner.address);
    expect(balanceAfter).to.equal(balanceBefore + 2n * mintAmount);
  });

  it('Should NOT set mint amount', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const mintAmount = 1000n;
    const instance = protoCoin.connect(otherAccount);

    await expect(instance.setMintAmount(mintAmount)).to.be.revertedWith(
      'You do not have permission.'
    );
  });

  it('Should NOT set mint delay', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const mintDelay = 1000n;
    const instance = protoCoin.connect(otherAccount);

    await expect(instance.setMintDelay(mintDelay)).to.be.revertedWith(
      'You do not have permission.'
    );
  });

  it('Should NOT mint', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    await expect(protoCoin.mint()).to.be.revertedWith(
      'Minting is not enabled.'
    );
  });

  it('Should NOT mint twice', async function () {
    const { protoCoin, owner, otherAccount } = await loadFixture(deployFixture);

    const mintAmount = 1000n;
    await protoCoin.setMintAmount(mintAmount);

    await protoCoin.mint();

    await expect(protoCoin.mint()).to.be.revertedWith(
      'You cannot mint twice in a row.'
    );
  });
});
