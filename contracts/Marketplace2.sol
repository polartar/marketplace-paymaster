// SDPX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Marketplace.sol";

contract Marketplace2 is Marketplace {
  function name() public pure returns (string memory){
      return "Marketplace2";
  }
}