//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenRegistry is Ownable,Pausable {
	// Contract name
    string private _name;

	struct Token {
		address addr;
		uint decimals;
		string name;
		string symbol;
		bool deleted;
	}

	event Registered(uint indexed id, address addr, string name, string symbol);
	event Unregistered(uint indexed id, string symbol);

	mapping (address => uint) mapFromAddress;
	mapping (string => uint) mapFromSymbol;
	Token[] tokens;
	uint public fee = 2000000000000000000; // 2 eth
	uint public tokenCount = 0;

    function name() public view virtual returns (string memory) {
        return _name;
    }

	modifier whenFeePaid {
		if (msg.value < fee)
			return;
		_;
	}

	modifier whenAddressFree(address _addr) {
		if (isRegistered(_addr))
			return;
		_;
	}

	modifier whenSymbolFree(string memory _symbol) {
		if (mapFromSymbol[_symbol] != 0)
			return;
		_;
	}

	modifier isValidSymbol(string memory _symbol) {
		if (bytes(_symbol).length < 3 || bytes(_symbol).length > 4)
			return;
		_;
	}

	modifier whenToken(uint _id) {
		require(!tokens[_id].deleted);
		_;
	}

	constructor (){
		_name = "CV Token registy v1";
	}

	function register(
		address addr_,
		string memory symbol_,
		uint decimals_,
		string memory name_
	)
		external
		payable
		returns (bool)
	{
		return registerAs(
			addr_,
			symbol_,
			decimals_,
			name_
		);
	}

    function togglePause() public onlyOwner{
        if(this.paused()){
            _unpause();
        }else{
            _pause();
        }
    }

	function unregister(uint _id)
		external
		whenToken(_id)
		onlyOwner
	{
		delete mapFromAddress[tokens[_id].addr];
		delete mapFromSymbol[tokens[_id].symbol];
		tokens[_id].deleted = true;
		tokenCount = tokenCount - 1;

        emit Unregistered(_id, tokens[_id].symbol);
	}

	function setFee(uint _fee)
		external
		onlyOwner
	{
		fee = _fee;
	}

	function drain()
		external
		onlyOwner
	{
		payable(msg.sender).transfer(address(this).balance);
	}

	function token(uint _id)
		external
		view
		whenToken(_id)
		returns (
			address addr,
			string memory symbol,
			uint decimals,
			string memory name_
		)
	{
		Token storage t = tokens[_id];
		addr = t.addr;
		symbol = t.symbol;
		decimals = t.decimals;
		name_ = t.name;
	}

	function fromAddress(address _addr)
		external
		view
		whenToken(mapFromAddress[_addr] - 1)
		returns (
			uint id_,
			string memory symbol_,
			uint decimals_,
			string memory name_
		)
	{
		id_ = mapFromAddress[_addr] - 1;
		Token storage t = tokens[id_];
		symbol_ = t.symbol;
		decimals_ = t.decimals;
		name_ = t.name;
	}

	function fromSymbol(string memory _symbol)
		external
		view
		whenToken(mapFromSymbol[_symbol] - 1)
		returns (
			uint id_,
			address addr_,
			uint decimals_,
			string memory name_
		)
	{
		id_ = mapFromSymbol[_symbol] - 1;
		Token storage t = tokens[id_];
		addr_ = t.addr;
		decimals_ = t.decimals;
		name_ = t.name;
	}

	function registerAs(
		address addr_,
		string memory symbol_,
		uint decimals_,
		string memory name_
	)
		public
		payable
        whenNotPaused
		whenFeePaid
		whenAddressFree(addr_)
		isValidSymbol(symbol_)
		whenSymbolFree(symbol_)
		returns (bool)
	{
		tokens.push(Token(
			addr_,
            decimals_,
			symbol_,
			name_,
            false
		));
        uint length = tokens.length;
		mapFromAddress[addr_] = length;
		mapFromSymbol[symbol_] = length;

		emit Registered(
            tokens.length - 1,
			addr_,
			name_,
            symbol_
		);

		tokenCount = tokenCount + 1;
		return true;
	}

    function isRegistered(address _address) public view returns(bool) {
        if (mapFromAddress[_address] == 0) {
			return false;
        }
        return true;
    }
}