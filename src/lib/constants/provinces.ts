/**
 * Deliberately its own file with zero imports — safe to import from client
 * components. `validation/common.ts` also imports ObjectId from the
 * `mongodb` package (Node-only, depends on built-ins like `net`), so
 * importing anything from that file into client code breaks the browser
 * bundle.
 */
export const PAKISTANI_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir',
  'Islamabad Capital Territory',
] as const;
