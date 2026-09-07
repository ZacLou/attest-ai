#!/usr/bin/env bash
set -euo pipefail

source .env

: "${DEPLOYER_PRIVATE_KEY:?DEPLOYER_PRIVATE_KEY is required}"
: "${CREDITCOIN_RPC_URL:?CREDITCOIN_RPC_URL is required}"

forge create \
  --broadcast \
  --rpc-url "$CREDITCOIN_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  contracts/AttestGuard.sol:AttestGuard
