// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "./NSignatures.sol";

contract Token is ERC20, NSignatures {
    event Burn(address indexed from, uint256 indexed value, string btcAddress);

    constructor(
        uint th,
        string memory name,
        string memory symbol,
        address[] memory _owners
    ) ERC20(name, symbol) NSignatures(name, th, _owners) {}

    function mint(
        address to,
        uint256 amount,
        uint256 txHash,
        bytes[] memory signatures
    ) public {
        checkNSignatures(to, amount, txHash, signatures);
        _mint(to, amount);
    }

    function burn(uint256 amount, string memory btcAddress) public {
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount, btcAddress);
    }
}
