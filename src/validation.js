export const MAX_UINT256 = (1n << 256n) - 1n;
export function parseNumber(raw) {
  if (!/^\d+$/.test(raw.trim())) throw new Error('Enter a whole number, zero or greater.');
  const value = BigInt(raw.trim());
  if (value > MAX_UINT256) throw new Error('This number is too large for the contract (maximum 256 bits).');
  return value;
}
