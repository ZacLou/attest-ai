#!/usr/bin/env bash
set -euo pipefail

source .env

: "${DEPLOYER_PRIVATE_KEY:?DEPLOYER_PRIVATE_KEY is required}"
: "${CREDITCOIN_RPC_URL:?CREDITCOIN_RPC_URL is required}"
: "${ATTEST_GUARD_ADDRESS:?ATTEST_GUARD_ADDRESS is required}"
: "${SOURCE_SIGNAL_ADDRESS:?SOURCE_SIGNAL_ADDRESS is required}"

cast send \
  --rpc-url "$CREDITCOIN_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  "$ATTEST_GUARD_ADDRESS" \
  "setTrustedSourceSignal(address)" \
  "$SOURCE_SIGNAL_ADDRESS"
