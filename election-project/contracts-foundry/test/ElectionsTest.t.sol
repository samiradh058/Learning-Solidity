// test/Elections.t.sol
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/Elections.sol";

contract ElectionsTest is Test {
    Elections elections;

    function setUp() public {
        elections = new Elections(block.timestamp, block.timestamp + 1 days);
    }

    function testApplyCandidateLogs() public {
        elections.applyAsCandidate("Alice");
    }
}
