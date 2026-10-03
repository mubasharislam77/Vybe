export type SearchParamsInput = Record<string, string | string[] | undefined>;

/** Builds a new query string from current params + a patch, dropping `cursor`/`prevCursors` (pagination resets whenever filters/sort change) unless explicitly included in the patch. */
export function buildQueryString(
  current: SearchParamsInput,
  patch: Record<string, string | string[] | null | undefined>,
  options: { resetPagination?: boolean } = { resetPagination: true },
): string {
  const params = new URLSearchParams();
  const merged: Record<string, string | string[] | null | undefined> = { ...current, ...patch };

  for (const [key, value] of Object.entries(merged)) {
    if (options.resetPagination && (key === 'cursor' || key === 'prevCursors') && !(key in patch)) {
      continue;
    }
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.set(key, value);
    }
  }
  return params.toString();
}

export function getParamArray(params: SearchParamsInput, key: string): string[] {
  const value = params[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function getParam(params: SearchParamsInput, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function nextPageHref(current: SearchParamsInput, nextCursor: string): string {
  const prevStack = getParamArray(current, 'prevCursors');
  const currentCursor = getParam(current, 'cursor');
  const newStack = currentCursor ? [...prevStack, currentCursor] : prevStack;
  return '?' + buildQueryString(current, { cursor: nextCursor, prevCursors: newStack }, { resetPagination: false });
}

export function prevPageHref(current: SearchParamsInput): string {
  const prevStack = getParamArray(current, 'prevCursors');
  if (prevStack.length === 0) {
    return '?' + buildQueryString(current, { cursor: null, prevCursors: null }, { resetPagination: false });
  }
  const newCursor = prevStack[prevStack.length - 1];
  const newStack = prevStack.slice(0, -1);
  return (
    '?' + buildQueryString(current, { cursor: newCursor, prevCursors: newStack.length ? newStack : null }, { resetPagination: false })
  );
}
