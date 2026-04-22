// Vendors that are internal to Debrecht (their own GC arm, not third parties).
// LJLD LLC is how Lorenzo's team pays themselves for GC work — payments to
// these vendors represent internal allocations, not outside spend.
export const INTERNAL_GC_VENDORS = ["LJLD LLC", "LJLD"];

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const INTERNAL_SET = new Set(INTERNAL_GC_VENDORS.map(norm));

export function isInternalGC(vendorName) {
  return INTERNAL_SET.has(norm(vendorName));
}
