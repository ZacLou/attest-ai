// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SourceRiskSignal} from "../contracts/SourceRiskSignal.sol";
import {AttestGuard} from "../contracts/AttestGuard.sol";

contract PolicyTest {
    SourceRiskSignal private source;
    AttestGuard private guard;

    address private constant reporter = address(0x1111);
    address private constant subject = address(0x2222);

    function setUp() public {
        source = new SourceRiskSignal();
        guard = new AttestGuard();
        guard.setTrustedSourceSignal(address(source));
    }

    function testPoliciesMatchForLowValue() public view {
        uint256 value = 0.01 ether;
        uint8 sourceScore = source.computeRiskScore(reporter, subject, value);
        uint8 guardScore = guard.computeRiskScore(reporter, subject, value);
        assert(sourceScore == 20);
        assert(guardScore == sourceScore);
    }

    function testPoliciesMatchForMidValue() public view {
        uint256 value = 0.1 ether;
        uint8 sourceScore = source.computeRiskScore(reporter, subject, value);
        uint8 guardScore = guard.computeRiskScore(reporter, subject, value);
        assert(sourceScore == 50);
        assert(guardScore == sourceScore);
    }

    function testPoliciesMatchForVeryHighValue() public view {
        uint256 value = 0.6 ether;
        uint8 sourceScore = source.computeRiskScore(reporter, subject, value);
        uint8 guardScore = guard.computeRiskScore(reporter, subject, value);
        assert(sourceScore == 80);
        assert(guardScore == sourceScore);
    }

    function testPoliciesMatchForSelfDirectedZeroValue() public view {
        uint8 sourceScore = source.computeRiskScore(reporter, reporter, 0);
        uint8 guardScore = guard.computeRiskScore(reporter, reporter, 0);
        assert(sourceScore == 45);
        assert(guardScore == sourceScore);
    }

    function testEvidenceHashesMatch() public view {
        bytes32 sourceHash = source.computeEvidenceHash(reporter, subject, 0.01 ether, 20);
        bytes32 guardHash = guard.computeEvidenceHash(reporter, subject, 0.01 ether, 20);
        assert(sourceHash == guardHash);
    }

    function testOnlyOwnerCanSetTrustedSource() public {
        AttestGuard otherGuard = new AttestGuard();
        address attacker = address(0x9999);
        UnauthorizedActor actor = new UnauthorizedActor();

        assert(!actor.setTrustedSource(otherGuard, address(1)));
        assert(!actor.transferOwnership(otherGuard, attacker));

        otherGuard.setTrustedSourceSignal(address(1));
        assert(otherGuard.trustedSourceSignal() == address(1));

        otherGuard.transferOwnership(attacker);
        assert(otherGuard.owner() == attacker);
    }
}

contract UnauthorizedActor {
    function setTrustedSource(AttestGuard target, address sourceSignal) external returns (bool) {
        (bool success, ) = address(target).call(
            abi.encodeWithSignature("setTrustedSourceSignal(address)", sourceSignal)
        );
        return success;
    }

    function transferOwnership(AttestGuard target, address newOwner) external returns (bool) {
        (bool success, ) = address(target).call(
            abi.encodeWithSignature("transferOwnership(address)", newOwner)
        );
        return success;
    }
}
