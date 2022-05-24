//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
// import "@opengsn/gsn/contracts/interfaces/IKnowForwarderAddress.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract Counter is BaseRelayRecipient {
	string public override versionRecipient = "2.2.1";
	uint public counter;
	address public lastCaller;

	constructor(address _forwarder) {
		_setTrustedForwarder(_forwarder);
	}

	function increment() public {
		counter ++;
		lastCaller = _msgSender();
	}
}