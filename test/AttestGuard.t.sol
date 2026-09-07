// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";

import {AttestGuard} from "../contracts/AttestGuard.sol";
import {SourceRiskSignal} from "../contracts/SourceRiskSignal.sol";

interface Vm {
    function expectRevert(bytes memory revertData) external;
}

contract AttestGuardHarness is AttestGuard {
    function process(bytes32 queryId, bytes memory encodedTransaction) external {
        _processAndEmitEvent(0, queryId, encodedTransaction);
    }

    function decision(bytes32 id) external view returns (Decision memory) {
        return decisions[id];
    }
}

contract AttestGuardTest {
    Vm private constant vm = Vm(address(uint160(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D)));
    AttestGuardHarness private guard;
    SourceRiskSignal private source;
    address private reporter = address(0x1111);
    address private subject = address(0x2222);
    bytes32 private intentId = bytes32(uint256(1));

    function setUp() public {
        guard = new AttestGuardHarness();
        source = new SourceRiskSignal();
        guard.setTrustedSourceSignal(address(source));
    }

    function testRecordsLowRiskDecision() public {
        bytes memory encodedTransaction = buildTransaction(true, address(source), true, 0.01 ether, 20);
        bytes32 queryId = bytes32(uint256(10));

        guard.process(queryId, encodedTransaction);

        AttestGuard.Decision memory decision = guard.decision(intentId);
        assert(decision.riskScore == 20);
        assert(decision.allowed);
    }

    function testRecordsHighRiskDecision() public {
        bytes memory encodedTransaction = buildTransaction(true, address(source), true, 0.6 ether, 80);

        guard.process(bytes32(uint256(11)), encodedTransaction);

        AttestGuard.Decision memory decision = guard.decision(intentId);
        assert(decision.riskScore == 80);
        assert(!decision.allowed);
    }

    function testRejectsFailedSourceReceipt() public {
        bytes memory encodedTransaction = buildTransaction(false, address(source), true, 0.01 ether, 20);

        vm.expectRevert("Transaction did not succeed");
        guard.process(bytes32(uint256(12)), encodedTransaction);
    }

    function testRejectsUntrustedEmitter() public {
        bytes memory encodedTransaction = buildTransaction(true, address(0x9999), true, 0.01 ether, 20);

        vm.expectRevert("Untrusted source emitter");
        guard.process(bytes32(uint256(13)), encodedTransaction);
    }

    function testRejectsMalformedEventTopics() public {
        bytes memory encodedTransaction = buildTransaction(true, address(source), false, 0.01 ether, 20);

        vm.expectRevert("Invalid risk signal topics");
        guard.process(bytes32(uint256(14)), encodedTransaction);
    }

    function testRejectsTamperedRiskScore() public {
        bytes memory encodedTransaction = buildTransaction(true, address(source), true, 0.01 ether, 21);

        vm.expectRevert("Risk score does not match policy");
        guard.process(bytes32(uint256(15)), encodedTransaction);
    }

    function testRejectsDuplicateIntent() public {
        bytes memory encodedTransaction = buildTransaction(true, address(source), true, 0.01 ether, 20);

        guard.process(bytes32(uint256(16)), encodedTransaction);

        vm.expectRevert(abi.encodeWithSelector(AttestGuard.DuplicateIntent.selector, intentId));
        guard.process(bytes32(uint256(17)), encodedTransaction);
    }

    function buildTransaction(
        bool successfulReceipt,
        address emitter,
        bool validTopics,
        uint256 sourceValue,
        uint8 recordedScore
    ) private view returns (bytes memory) {
        bytes32[] memory topics = new bytes32[](validTopics ? 4 : 3);
        topics[0] = guard.RISK_SIGNAL_EVENT_SIGNATURE();
        topics[1] = bytes32(uint256(uint160(reporter)));
        topics[2] = intentId;
        if (validTopics) topics[3] = bytes32(uint256(uint160(subject)));

        bytes32 evidenceHash = guard.computeEvidenceHash(
            reporter,
            subject,
            sourceValue,
            guard.computeRiskScore(reporter, subject, sourceValue)
        );
        bytes memory eventData = abi.encode(sourceValue, recordedScore, guard.POLICY_VERSION(), evidenceHash);

        EvmV1Decoder.LogEntryTuple[] memory logs = new EvmV1Decoder.LogEntryTuple[](1);
        logs[0] = EvmV1Decoder.LogEntryTuple({
            address_: emitter,
            topics: topics,
            data: eventData
        });

        bytes[] memory chunks = new bytes[](3);
        chunks[0] = abi.encode(
            uint64(1),
            uint64(21_000),
            reporter,
            false,
            address(this),
            0,
            hex""
        );
        chunks[1] = abi.encode(uint128(1 gwei), uint256(27), bytes32(uint256(1)), bytes32(uint256(2)));
        chunks[2] = abi.encode(
            successfulReceipt ? uint8(1) : uint8(0),
            uint64(21_000),
            logs,
            hex""
        );

        return abi.encode(uint8(0), chunks);
    }
}
