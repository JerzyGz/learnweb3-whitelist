import { ethers } from "hardhat";

async function main() {
  const  whitelistContract = await ethers.getContractFactory("Whitelist");

  // 10 is the maximum number of whitelisted addresses allowed, for this example
  const deployedWhitelistContract = await whitelistContract.deploy(10);

  await deployedWhitelistContract.deployed();
  // print the address of the deployed contract
  console.log(
    "Whitelist Contract Address:",
    deployedWhitelistContract.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
