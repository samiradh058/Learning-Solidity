// SPDX-License-Identifier:MIT

pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {SimpleStorage} from "../src/SimpleStorage.sol";

contract DeploySimpleStorage is Script{
    function run() external returns (SimpleStorage){
        vm.startBroadcast();
        // new creates new instance of the contract
        SimpleStorage simpleStorage = new SimpleStorage();
        vm.stopBroadcast();
        return simpleStorage;
    }
}