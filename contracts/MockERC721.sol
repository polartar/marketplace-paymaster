// SDPX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {

    constructor () ERC721("Mock NFT", "MT"){
    }

    function mint(uint256 id) public {
        _mint(msg.sender, id);
    }
}