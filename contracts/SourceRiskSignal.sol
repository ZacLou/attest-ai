// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SourceRiskSignal {
    uint8 public constant POLICY_VERSION = 1;

    event RiskSignalRecorded(
        address indexed reporter,
        bytes32 indexed intentId,
        address indexed subject,
        uint256 sourceValue,
        uint8 riskScore,
        uint8 policyVersion,
        bytes32 evidenceHash
    );

    mapping(address => uint256) private nonces;

    function record(address subject, uint256 sourceValue)
        external
        returns (bytes32 intentId, uint8 riskScore)
    {
        require(subject != address(0), "Subject cannot be zero");

        riskScore = computeRiskScore(msg.sender, subject, sourceValue);
        intentId = computeIntentId(msg.sender, subject, sourceValue, riskScore);
        bytes32 evidenceHash = computeEvidenceHash(
            msg.sender,
            subject,
            sourceValue,
            riskScore
        );

        nonces[msg.sender] += 1;

        emit RiskSignalRecorded(
            msg.sender,
            intentId,
            subject,
            sourceValue,
            riskScore,
            POLICY_VERSION,
            evidenceHash
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

    function computeIntentId(
        address reporter,
        address subject,
        uint256 sourceValue,
        uint8 riskScore
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    block.chainid,
                    reporter,
                    nonces[reporter],
                    subject,
                    sourceValue,
                    riskScore
                )
            );
    }
}
