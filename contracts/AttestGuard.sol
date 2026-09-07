// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ASCBase} from "@gluwa/asc-contracts/contracts/readability/ASCBase.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";

contract AttestGuard is ASCBase {
    uint8 public constant POLICY_VERSION = 1;
    uint8 public constant RISK_THRESHOLD = 60;
    bytes32 public constant RISK_SIGNAL_EVENT_SIGNATURE =
        keccak256(
            "RiskSignalRecorded(address,bytes32,address,uint256,uint8,uint8,bytes32)"
        );

    struct Decision {
        address reporter;
        address subject;
        uint256 sourceValue;
        uint8 riskScore;
        uint8 policyVersion;
        bytes32 evidenceHash;
        uint256 recordedAt;
        bool allowed;
    }

    address public owner;
    address public trustedSourceSignal;
    mapping(bytes32 => Decision) public decisions;

    event DecisionRecorded(
        bytes32 indexed intentId,
        address indexed subject,
        uint256 sourceValue,
        uint8 riskScore,
        uint8 policyVersion,
        bool allowed,
        bytes32 evidenceHash,
        bytes32 indexed queryId
    );
    event TrustedSourceSignalSet(address indexed sourceSignal);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error InvalidAction(uint8 action);
    error DuplicateIntent(bytes32 intentId);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function setTrustedSourceSignal(address sourceSignal) external {
        require(msg.sender == owner, "Only owner");
        require(sourceSignal != address(0), "Source signal cannot be zero");
        trustedSourceSignal = sourceSignal;
        emit TrustedSourceSignalSet(sourceSignal);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        require(newOwner != address(0), "New owner cannot be zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _processAndEmitEvent(
        uint8 action,
        bytes32 queryId,
        bytes memory encodedTransaction
    ) internal override {
        if (action != 0) revert InvalidAction(action);
        _recordDecision(queryId, encodedTransaction);
    }

    function _recordDecision(bytes32 queryId, bytes memory encodedTransaction) private {
        uint8 txType = EvmV1Decoder.getTransactionType(encodedTransaction);
        require(EvmV1Decoder.isValidTransactionType(txType), "Unsupported transaction type");

        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(
            encodedTransaction
        );
        require(receipt.receiptStatus == 1, "Transaction did not succeed");

        EvmV1Decoder.LogEntry[] memory riskLogs = EvmV1Decoder.getLogsByEventSignature(
            receipt,
            RISK_SIGNAL_EVENT_SIGNATURE
        );
        require(riskLogs.length == 1, "Exactly one risk signal is required");

        EvmV1Decoder.LogEntry memory riskLog = riskLogs[0];
        require(riskLog.address_ == trustedSourceSignal, "Untrusted source emitter");
        require(riskLog.topics.length == 4, "Invalid risk signal topics");

        address reporter = address(uint160(uint256(riskLog.topics[1])));
        bytes32 intentId = riskLog.topics[2];
        address subject = address(uint160(uint256(riskLog.topics[3])));
        (
            uint256 sourceValue,
            uint8 recordedRiskScore,
            uint8 policyVersion,
            bytes32 evidenceHash
        ) = abi.decode(riskLog.data, (uint256, uint8, uint8, bytes32));

        require(subject != address(0), "Subject cannot be zero");
        require(policyVersion == POLICY_VERSION, "Unsupported policy version");

        uint8 computedRiskScore = computeRiskScore(reporter, subject, sourceValue);
        require(recordedRiskScore == computedRiskScore, "Risk score does not match policy");
        require(
            evidenceHash == computeEvidenceHash(reporter, subject, sourceValue, computedRiskScore),
            "Evidence hash does not match policy"
        );

        Decision storage existing = decisions[intentId];
        if (existing.recordedAt != 0) revert DuplicateIntent(intentId);

        bool allowed = computedRiskScore <= RISK_THRESHOLD;
        decisions[intentId] = Decision({
            reporter: reporter,
            subject: subject,
            sourceValue: sourceValue,
            riskScore: computedRiskScore,
            policyVersion: policyVersion,
            evidenceHash: evidenceHash,
            recordedAt: block.timestamp,
            allowed: allowed
        });

        emit DecisionRecorded(
            intentId,
            subject,
            sourceValue,
            computedRiskScore,
            policyVersion,
            allowed,
            evidenceHash,
            queryId
        );
    }

    function computeRiskScore(
        address reporter,
        address subject,
        uint256 sourceValue
    ) public pure returns (uint8 riskScore) {
        riskScore = 20;

        if (sourceValue > 0.05 ether) riskScore += 30;
        if (sourceValue > 0.5 ether) riskScore += 30;
        if (subject == reporter) riskScore += 15;
        if (sourceValue == 0) riskScore += 10;

        if (riskScore > 100) riskScore = 100;
    }

    function computeEvidenceHash(
        address reporter,
        address subject,
        uint256 sourceValue,
        uint8 riskScore
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    POLICY_VERSION,
                    reporter,
                    subject,
                    sourceValue,
                    riskScore
                )
            );
    }
}
