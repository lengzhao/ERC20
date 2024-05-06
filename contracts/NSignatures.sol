// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

abstract contract NSignatures is EIP712, Nonces {
    uint public threshold = 1;
    uint public ownerCount = 0;
    mapping(address => bool) public owners;
    mapping(uint256 => bool) public finishedTx;

    bytes32 private constant MINT_TYPEHASH =
        keccak256("Mint(address user,uint256 value,uint256 hash)");
    bytes32 private constant SET_OWNER_TYPEHASH =
        keccak256(
            "SetOwner(address owner,bool isOwner,uint256 threshold,uint256 nonce)"
        );

    error InvalidSigner(uint index, address signer);
    error ThresholdError(uint hope, uint have);
    error TxFinished(uint256 txhash);

    constructor(
        string memory name,
        uint th,
        address[] memory _owners
    ) EIP712(name, "1.0") {
        for (uint i = 0; i < _owners.length; i++) {
            owners[_owners[i]] = true;
        }
        threshold = th;
        ownerCount = _owners.length;
    }

    function DOMAIN_SEPARATOR() external view virtual returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _check(bytes32 hash, bytes[] memory signatures) private view {
        if (signatures.length < threshold) {
            revert ThresholdError(threshold, signatures.length);
        }
        address lastOwner = address(0);
        for (uint i = 0; i < signatures.length; i++) {
            address signer = ECDSA.recover(hash, signatures[i]);
            if ((signer <= lastOwner) || (owners[signer] == false)) {
                revert InvalidSigner(i, signer);
            }
            lastOwner = signer;
        }
    }

    function checkNSignatures(
        address user,
        uint256 value,
        uint256 txhash,
        bytes[] memory signatures
    ) public virtual {
        if (finishedTx[txhash]) {
            revert TxFinished(txhash);
        }
        finishedTx[txhash] = true;

        bytes32 structHash = keccak256(
            abi.encode(MINT_TYPEHASH, user, value, txhash)
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        _check(hash, signatures);
    }

    function setOwner(
        address owner,
        bool isOwner,
        uint256 newThreshold,
        bytes[] memory signatures
    ) public virtual {
        if (owners[owner] == isOwner) {
            return;
        }
        bytes32 structHash = keccak256(
            abi.encode(
                SET_OWNER_TYPEHASH,
                owner,
                isOwner,
                newThreshold,
                _useNonce(address(this))
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        _check(hash, signatures);

        owners[owner] = isOwner;
        threshold = newThreshold;
        if (isOwner) {
            ownerCount++;
        } else {
            ownerCount--;
        }
        require(threshold <= ownerCount, "ThresholdError");
    }
}
