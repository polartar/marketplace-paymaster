// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library KeySetLib {

    struct Set {
        mapping(bytes32 => uint) keyPointers;
        bytes32[] keyList;
    }

    function insert(Set storage self, bytes32 key) internal {
        require(key != 0x0, "UnorderedKeySet(100) - Key cannot be 0x0");
        require(!exists(self, key), "UnorderedKeySet(101) - Key already exists in the set.");
        self.keyList.push(key);
        self.keyPointers[key] = self.keyList.length - 1;
    }

    function remove(Set storage self, bytes32 key) internal {
        require(exists(self, key), "UnorderedKeySet(102) - Key does not exist in the set.");
        bytes32 keyToMove = self.keyList[count(self)-1];
        uint rowToReplace = self.keyPointers[key];
        self.keyPointers[keyToMove] = rowToReplace;
        self.keyList[rowToReplace] = keyToMove;
        delete self.keyPointers[key];
        self.keyList.pop();
    }

    function count(Set storage self) internal view returns(uint) {
        return(self.keyList.length);
    }

    function exists(Set storage self, bytes32 key) internal view returns(bool) {
        if(self.keyList.length == 0) return false;
        return self.keyList[self.keyPointers[key]] == key;
    }

    function keyAtIndex(Set storage self, uint index) internal view returns(bytes32) {
        return self.keyList[index];
    }

    function nukeSet(Set storage self) public {
        delete self.keyList;
    }
}

contract KeySet {

    using KeySetLib for KeySetLib.Set;
    KeySetLib.Set set;

    event LogUpdate(address sender, string action, bytes32 key);

    function exists(bytes32 key) public view returns(bool) {
        return set.exists(key);
    }

    function insert(bytes32 key) public {
        set.insert(key);
        emit LogUpdate(msg.sender, "insert", key);
    }

    function remove(bytes32 key) public {
        set.remove(key);
        emit LogUpdate(msg.sender, "remove", key);
    }

    function count() public view returns(uint) {
        return set.count();
    }

    function keyAtIndex(uint index) public view returns(bytes32) {
        return set.keyAtIndex(index);
    }
}