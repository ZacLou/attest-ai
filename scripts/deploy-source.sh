#!/usr/bin/env bash
set -euo pipefail

source .env

: "${DEPLOYER_PRIVATE_KEY:?DEPLOYER_PRIVATE_KEY is required}"
: "${SOURCE_CHAIN_RPC_URL:?SOURCE_CHAIN_RPC_URL is required}"

forge create \
  --broadcast \
  --rpc-url "$SOURCE_CHAIN_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  contracts/SourceRiskSignal.sol:SourceRiskSignal
