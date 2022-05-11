//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./CryptovoxelsAccessControl.sol";

contract ERC721M is ERC721, CryptovoxelsAccessControl {
    using Counters for Counters.Counter;

    Counters.Counter private tokenId;
    mapping(uint256 => string) metadatas;

    uint256 internal fee = 0.01 ether;
    address _openseaAddress;

    constructor() ERC721("ERC721", "TT") CryptovoxelsAccessControl() {
        tokenId.increment();
        _openseaAddress = 0x58807baD0B376efc12F5AD86aAc70E78ed67deaE;
    }

    function setFee(uint256 _fee) external onlyMember {
        fee = _fee;
    }

    function getFee() public view returns (uint256){
        return fee;
    }

    function mint(uint256 _tokenId, string memory _metadata) external payable {
        require(fee == msg.value, "invalid amount");
        require(_tokenId > 0, 'token id cannot be lower than 1');
        require(!_exists(_tokenId),'token id already exists');

        _mint(msg.sender, _tokenId);
        metadatas[_tokenId] = _metadata;
    }

    function tokenURI(uint256 _tokenId)
        public view virtual override returns (string memory)
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return metadatas[_tokenId];
    }

    function supportsInterface(bytes4 interfaceId) 
            public view override(AccessControl, ERC721) returns (bool) 
    {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    function withdraw() external onlyMember {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "failed to withdraw");
    }

    function setOpenseaContractAddress(address _impl) public onlyMember {
        _openseaAddress = _impl;
    }

    function isApprovedForAll(
        address _owner,
        address _operator
    ) public override view returns (bool isOperator) {
        // if OpenSea's ERC1155 Proxy Address is detected, auto-return true
       if (_operator == address( _openseaAddress )) {
            return true;
        }
        // otherwise, use the default ERC1155.isApprovedForAll()
        return ERC721.isApprovedForAll(_owner, _operator);
    }
}
