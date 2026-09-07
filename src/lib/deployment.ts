export const SOURCE_SIGNAL_ADDRESS = (
  import.meta.env.VITE_SOURCE_SIGNAL_ADDRESS ?? ""
).toLowerCase();

export const ATTEST_GUARD_ADDRESS = (
  import.meta.env.VITE_ATTEST_GUARD_ADDRESS ?? ""
).toLowerCase();

export const SOURCE_READY = SOURCE_SIGNAL_ADDRESS.length === 42;
export const ATTEST_GUARD_READY = ATTEST_GUARD_ADDRESS.length === 42;
