import { ethers } from 'hardhat';

async function main() {
  const protoCoin = await ethers.deployContract('ProtoCoin');

  await protoCoin.waitForDeployment();

  const address = await protoCoin.getAddress();

  console.log(`Contract deployed at ${address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
