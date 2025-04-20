// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18; // solidity version

contract SimpleStorage{
    uint256 myFavNumber; // 0

    // uint256[] listOfFavNumbers;
    struct Person{
        uint256 favNumber;
        string name;
    }

    Person[] public listOfPeople;

    mapping(string => uint256) public nameToFavNumber;

    // Person public john = Person(7, "John");

    function store(uint256 _favNumber) public virtual {
        myFavNumber=_favNumber;
    }

    function retrieve() public view returns (uint256){
        return myFavNumber;
    }

// calldata, memory, storage
    function addPerson (string memory _name, uint256 _favNumber) public {
        listOfPeople.push(Person(_favNumber, _name));
        nameToFavNumber[_name] = _favNumber;
    }
}
