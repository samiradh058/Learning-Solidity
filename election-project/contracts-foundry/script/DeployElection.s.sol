// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/Elections.sol";

contract DeployElection is Script {
    function run() external {
        uint electionStart = block.timestamp + 1 days;  // 1 day from now
        uint electionEnd = electionStart + 7 days;     // 7 days after election start

        // Deploy the Election contract to the local node
        vm.startBroadcast();
        new Elections(electionStart, electionEnd);  // Deploy the Election contract with start and end times
        vm.stopBroadcast();
    }
}
