//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
// import "@opengsn/gsn/contracts/interfaces/IKnowForwarderAddress.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";

contract CaptureTheFlag is BaseRelayRecipient {
	string public override versionRecipient = "2.0.0";

	event FlagCaptured(address _from, address _to);

	address flagHolder = address(0);

        // Get the forwarder address for the network
        // you are using from
        // https://docs.opengsn.org/gsn-provider/networks.html
	constructor(address _forwarder) {
		_setTrustedForwarder(_forwarder);
	}

	function captureFlag() external {
		address previous = flagHolder;

                // The real sender. If you are using GSN, this
                // is not the same as msg.sender.
		flagHolder = _msgSender();

		emit FlagCaptured(previous, flagHolder);
	}
	receive() external payable {
    }
}