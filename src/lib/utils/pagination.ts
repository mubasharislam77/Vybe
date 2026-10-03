import { ObjectId } from 'mongodb';

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 48;

export type SortDirection = 1 | -1;

/**
 * Keyset (cursor) pagination cursor: the sort-field value and the `_id` of
 * the last item on the previous page. Every listing here sorts by exactly
 * one primary field plus `_id` as a stable tie-breaker, so a single cursor
 * shape covers products, orders, customers, and reviews alike.
 */
export interface Cursor {
  value: string | number;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      parsed &&
      (typeof parsed.value === 'string' || typeof parsed.value === 'number') &&
      typeof parsed.id === 'string'
    ) {
      return parsed as Cursor;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Builds the Mongo filter clause for "strictly after this cursor" given a
 * sort direction on `field`, using `_id` as the tie-breaker. Combine with
 * `$and: [existingFilter, keysetClause]` in the caller.
 *
 * `field` must be a plain scalar/number field at query time — pass
 * `isDate: true` when it's a BSON Date, since the cursor round-trips the
 * value through JSON as an ISO string and must be converted back before
 * comparing (otherwise Mongo compares across BSON types and matches
 * nothing).
 */
export function keysetFilter(field: string, dir: SortDirection, cursor: Cursor, isDate = false) {
  const cmp = dir === 1 ? '$gt' : '$lt';
  let id: ObjectId | string = cursor.id;
  try {
    id = new ObjectId(cursor.id);
  } catch {
    // non-ObjectId tiebreaker (e.g. orderNumber-based listings) — keep as string
  }
  const value = isDate ? new Date(cursor.value) : cursor.value;
  return {
    $or: [
      { [field]: { [cmp]: value } },
      { [field]: value, _id: { [cmp]: id } },
    ],
  };
}

export function clampPageSize(requested: number | undefined): number {
  if (!requested || requested <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(requested, MAX_PAGE_SIZE);
}
