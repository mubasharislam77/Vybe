import type { UpdateFilter } from 'mongodb';

/**
 * The Node driver serializes `undefined` as BSON null unless `ignoreUndefined`
 * is set — so `$set: { videoUrl: undefined }` would store `null`, which then
 * fails `z.url().optional()` the next time the record is loaded into a
 * form. Admin "full replace" updates route through this helper so an
 * omitted optional field is actually removed from the document.
 */
export function toSetUnset<T extends object>(update: Partial<T>): UpdateFilter<T> {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ''> = {};
  for (const [key, value] of Object.entries(update)) {
    if (value === undefined) $unset[key] = '';
    else $set[key] = value;
  }
  const out: Record<string, unknown> = {};
  if (Object.keys($set).length) out.$set = $set;
  if (Object.keys($unset).length) out.$unset = $unset;
  return out as UpdateFilter<T>;
}
