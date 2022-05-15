// SDPX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "./lib/keyset.sol";

/* We may need to modify the ERCRegistery
  - whenToken :  if the token is no registered, it will return true;
*/
interface IERC20Registry {
    function register(address _addr, string memory _symbol, uint _decimals, string memory _name) external payable returns (bool);

    function togglePause(bool _paused) external;

	function unregister(uint _id) external;

	function setFee(uint _fee) external;

	function drain() external;

	function token(uint _id) external view returns (address addr, string memory symbol, uint decimals, string memory name);

	function fromAddress(address _addr) external view returns (uint id, string memory symbol, uint decimals, string memory name);

	function fromSymbol(string memory _symbol) external view returns (uint id, address addr, uint decimals, string memory name);

	function registerAs(address _addr, string memory _symbol, uint _decimals,string memory _name) external payable returns (bool);
}

struct Listing { 
    address seller;
    address contractAddress;
    uint tokenId;
    uint price;
    uint quantity;
}

contract Marketplace is Pausable, Ownable {
    event NewListing(    
        address seller,
        address contractAddress,
        uint tokenId,
        uint price,
        uint quantity,
        bytes32 listingId
    );

    event Sale(    
        address seller,
        address buyer,
        address contractAddress,
        uint tokenId,
        uint price,
        bytes32 listingId
    );

    using ERC165Checker for address;
    using KeySetLib for KeySetLib.Set;

    mapping (bytes32 => Listing) listings;
    
    KeySetLib.Set set;

    IERC20Registry internal registryAddress;
    uint public minPrice;
    uint public maxPrice;

    bytes4 public constant IID_IERC1155 = type(IERC1155).interfaceId;
    bytes4 public constant IID_IERC721 = type(IERC721).interfaceId;

    constructor (address _registryAddress) {
        registryAddress = IERC20Registry(_registryAddress);
        minPrice = 1;
        maxPrice = type(uint).max;
    }
   
    // function getListings () public view returns( Listing[] memory) {
    //     return listings;
    // }

    modifier onlyNFT(address _nftAddress) {
        require(_nftAddress.supportsInterface(IID_IERC1155) || _nftAddress.supportsInterface(IID_IERC721));
        _;
    }

    function getListingCount () public view returns (uint) {
        return set.count();
    }

    function getListingIdAtIndex (uint index) public view returns (bytes32) {
        return set.keyAtIndex(index);
    }

    function getListingAtIndex (uint index) public view returns (Listing memory) {
        return listings[set.keyAtIndex(index)];
    }

    function getListing (bytes32 id) public view returns (Listing memory) {
        return listings[id];
    }

    function _generateId(address _seller, address _contractAddress, uint256 _tokenId, uint256 _price) private pure returns (bytes32) {
        return keccak256(abi.encode(_seller, _contractAddress, _tokenId, _price));
    }

    function list (address contractAddress, uint tokenId, uint price, uint quantity) public onlyNFT(contractAddress) whenNotPaused returns (bytes32) {
        Listing memory l = Listing(msg.sender, contractAddress, tokenId, price, quantity);

        require(price >= minPrice, 'Price less than minimum');
        require(price < maxPrice, 'Price more than maximum');
        require(quantity > 0, 'Quantity is 0');

        bytes32 id = _generateId(msg.sender, contractAddress, tokenId, price);
        listings[id] = l;

        require(!set.exists(id), 'Listing already exists');
        set.insert(id);

        emit NewListing(
            msg.sender,
            contractAddress,
            tokenId,
            price,
            quantity,
            id
        );

        return id;
    }

    function buy (bytes32 id, uint quantity) public whenNotPaused {
        ERC20 token = ERC20(registryAddress);

        Listing memory l = listings[id];
        ERC1155 nft = ERC1155(l.contractAddress);

        require(l.quantity >= quantity, 'Quantity unavailable');
        require(l.seller != msg.sender, 'Buyer cannot be seller');
        require(token.transferFrom(msg.sender, l.seller, l.price * quantity));
        
        nft.safeTransferFrom(l.seller, msg.sender, l.tokenId, quantity, "0x0");

        l.quantity -= quantity;
        listings[id] = l;

        if (l.quantity == 0) {
            set.remove(id);
            delete listings[id];
        }

        emit Sale(l.seller, msg.sender, l.contractAddress, l.tokenId, l.price, id);
    }

    function setMin (uint t) public onlyOwner {
        require(t < maxPrice);
        minPrice = t;
    }

    function setMax (uint t) public onlyOwner {
        require(t > minPrice);
        maxPrice = t;
    }

    function pause () public onlyOwner {
        _pause();
    }

    function unpause () public onlyOwner {
        _unpause();
    }
}