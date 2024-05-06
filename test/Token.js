const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Coin", function () {
    const amount = 10 ** 15;
    async function deployCoinFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const Coin = await ethers.getContractFactory("Token");
        const coin = await Coin.deploy(1, "MyToken", "MTK", [owner.address]);

        return { coin, owner, otherAccount };
    }
    async function deploy3OwnerCoinFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner1, owner2, owner3, otherAccount] = await ethers.getSigners();

        const Coin = await ethers.getContractFactory("Token");
        const coin = await Coin.deploy(2, "MyToken", "MTK", [owner1.address, owner2.address, owner3.address]);

        return { coin, owner1, owner2, owner3, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right name", async function () {
            const { coin } = await loadFixture(deployCoinFixture);
            expect(await coin.name()).to.equal("MyToken");
        });

        it("Should set the right owner", async function () {
            const { coin, owner } = await loadFixture(deployCoinFixture);
            expect(await coin.owners(owner.address)).to.equal(true);
        });
    });

    describe("Mint", function () {
        it("mint to owner", async function () {
            const { coin, owner } = await loadFixture(deployCoinFixture);
            expect(await coin.balanceOf(owner)).to.equal(0);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    Mint: [
                        { name: 'user', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'hash', type: 'uint256' },
                    ]
                },
                message: {
                    user: owner.address,
                    value: amount,
                    hash: BigInt("0xcb34b357c1e15fae6167354fa3073e87338dd8fda6d0b24f58359f220d9221fd")
                }
            }

            const flatSig = await owner.signTypedData(td.domain, td.types, td.message);

            expect(await coin.mint(owner, amount, td.message.hash, [flatSig]))
            expect(await coin.balanceOf(owner)).to.equal(amount);
        });

        it("mint to other account", async function () {
            const { coin, owner, otherAccount } = await loadFixture(deployCoinFixture);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    Mint: [
                        { name: 'user', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'hash', type: 'uint256' },
                    ]
                },
                message: {
                    user: otherAccount.address,
                    value: amount,
                    hash: 2
                }
            }

            const flatSig = await owner.signTypedData(td.domain, td.types, td.message);

            expect(await coin.mint(otherAccount, amount, td.message.hash, [flatSig]))
            expect(await coin.balanceOf(otherAccount)).to.equal(amount);
        });

        it("mint by 2 owners", async function () {
            const { coin, owner1, owner2 } = await loadFixture(deploy3OwnerCoinFixture);
            expect(await coin.balanceOf(owner1)).to.equal(0);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    Mint: [
                        { name: 'user', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'hash', type: 'uint256' },
                    ]
                },
                message: {
                    user: owner1.address,
                    value: amount,
                    hash: 1
                }
            }

            const flatSig1 = await owner1.signTypedData(td.domain, td.types, td.message);
            const flatSig2 = await owner2.signTypedData(td.domain, td.types, td.message);
            var signs;
            if (owner1.address < owner2.address) {
                signs = [flatSig1, flatSig2];
            } else {
                signs = [flatSig2, flatSig1];
            }

            expect(await coin.mint(owner1, amount, td.message.hash, signs))
            expect(await coin.balanceOf(owner1)).to.equal(amount);
        });

        it("mint by 3 owners", async function () {
            const { coin, owner1, owner2, owner3 } = await loadFixture(deploy3OwnerCoinFixture);
            expect(await coin.balanceOf(owner1)).to.equal(0);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    Mint: [
                        { name: 'user', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'hash', type: 'uint256' },
                    ]
                },
                message: {
                    user: owner1.address,
                    value: amount,
                    hash: 1
                }
            }
            var owners = [owner1, owner2, owner3];
            owners.sort((a, b) => a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1);
            var signs = [];
            for (var i = 0; i < owners.length; i++) {
                const flatSig = await owners[i].signTypedData(td.domain, td.types, td.message);
                signs.push(flatSig);
            }
            expect(await coin.mint(owner1, amount, td.message.hash, signs))
            expect(await coin.balanceOf(owner1)).to.equal(amount);
        })


        it("wrong owner", async function () {
            const { coin, owner1, owner2, otherAccount } = await loadFixture(deploy3OwnerCoinFixture);
            expect(await coin.balanceOf(owner1)).to.equal(0);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    Mint: [
                        { name: 'user', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'hash', type: 'uint256' },
                    ]
                },
                message: {
                    user: owner1.address,
                    value: amount,
                    hash: 1
                }
            }
            var owners = [owner1, owner2, otherAccount];
            owners.sort((a, b) => a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1);
            var signs = [];
            for (var i = 0; i < owners.length; i++) {
                const flatSig = await owners[i].signTypedData(td.domain, td.types, td.message);
                signs.push(flatSig);
            }
            await expect(coin.mint(owner1, amount, td.message.hash, signs)).to.be.revertedWithCustomError(coin, "InvalidSigner");
        })


        it("not enough owners", async function () {
            const { coin, owner1 } = await loadFixture(deploy3OwnerCoinFixture);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    Mint: [
                        { name: 'user', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'hash', type: 'uint256' },
                    ]
                },
                message: {
                    user: owner1.address,
                    value: amount,
                    hash: 1
                }
            }

            const flatSig = await owner1.signTypedData(td.domain, td.types, td.message);

            await expect(coin.mint(owner1, amount, td.message.hash, [flatSig])).to.be.revertedWithCustomError(coin, "ThresholdError");
        })


        it("add owner", async function () {
            const { coin, owner1, owner2, otherAccount } = await loadFixture(deploy3OwnerCoinFixture);
            expect(await coin.owners(otherAccount.address)).to.equal(false);
            const isOwner = true;
            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    SetOwner: [
                        { name: 'owner', type: 'address' },
                        { name: 'isOwner', type: 'bool' },
                        { name: 'threshold', type: 'uint256' },
                        { name: 'nonce', type: 'uint256' },
                    ]
                },
                message: {
                    owner: otherAccount.address,
                    isOwner: isOwner,
                    threshold: 2,
                    nonce: await coin.nonces(coin.getAddress()),
                }
            }
            var owners = [owner1, owner2];
            owners.sort((a, b) => a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1);
            var signs = [];
            for (var i = 0; i < owners.length; i++) {
                const flatSig = await owners[i].signTypedData(td.domain, td.types, td.message);
                signs.push(flatSig);
            }
            expect(await coin.setOwner(otherAccount.address, isOwner, td.message.threshold, signs))
            expect(await coin.owners(otherAccount.address)).to.equal(isOwner);
        })
        it("disable owner", async function () {
            const { coin, owner1, owner2, owner3 } = await loadFixture(deploy3OwnerCoinFixture);
            expect(await coin.owners(owner3.address)).to.equal(true);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    SetOwner: [
                        { name: 'owner', type: 'address' },
                        { name: 'isOwner', type: 'bool' },
                        { name: 'threshold', type: 'uint256' },
                        { name: 'nonce', type: 'uint256' },
                    ]
                },
                message: {
                    owner: owner3.address,
                    isOwner: false,
                    threshold: 2,
                    nonce: await coin.nonces(coin.getAddress())
                }
            }
            var owners = [owner1, owner2];
            owners.sort((a, b) => a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1);
            var signs = [];
            for (var i = 0; i < owners.length; i++) {
                const flatSig = await owners[i].signTypedData(td.domain, td.types, td.message);
                signs.push(flatSig);
            }
            expect(await coin.setOwner(owner3.address, false, td.message.threshold, signs))
            expect(await coin.owners(owner3.address)).to.equal(false);
        })

        it("wrong threshold", async function () {
            const { coin, owner1, owner2, owner3 } = await loadFixture(deploy3OwnerCoinFixture);
            expect(await coin.owners(owner3.address)).to.equal(true);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    SetOwner: [
                        { name: 'owner', type: 'address' },
                        { name: 'isOwner', type: 'bool' },
                        { name: 'threshold', type: 'uint256' },
                        { name: 'nonce', type: 'uint256' },
                    ]
                },
                message: {
                    owner: owner3.address,
                    isOwner: false,
                    threshold: 3,
                    nonce: await coin.nonces(coin.getAddress())
                }
            }
            var owners = [owner1, owner2];
            owners.sort((a, b) => a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1);
            var signs = [];
            for (var i = 0; i < owners.length; i++) {
                const flatSig = await owners[i].signTypedData(td.domain, td.types, td.message);
                signs.push(flatSig);
            }
            await expect(coin.setOwner(owner3.address, false, td.message.threshold, signs)).to.be.revertedWith("ThresholdError");
        })
    })
    describe("Burn", function () {
        it("burn token", async function () {
            const { coin, owner } = await loadFixture(deployCoinFixture);
            expect(await coin.balanceOf(owner)).to.equal(0);

            const td = {
                domain: {
                    name: "MyToken",
                    version: '1.0',
                    chainId: await network.provider.send("eth_chainId"),
                    verifyingContract: await coin.getAddress()
                },
                types: {
                    Mint: [
                        { name: 'user', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'hash', type: 'uint256' },
                    ]
                },
                message: {
                    user: owner.address,
                    value: amount,
                    hash: 1
                }
            }

            const flatSig = await owner.signTypedData(td.domain, td.types, td.message);

            expect(await coin.mint(owner, amount, td.message.hash, [flatSig]))
            expect(await coin.balanceOf(owner)).to.equal(amount);

            const btcAddr = "bc1qllsww7ldf6wuv2qhv2tw6ry53gnk7ducg4hy66";
            await expect(coin.burn(amount / 2, btcAddr)).to.emit(coin, "Burn").withArgs(owner.address, amount / 2, btcAddr);
            expect(await coin.balanceOf(owner)).to.equal(amount / 2);
        });
    })

});
