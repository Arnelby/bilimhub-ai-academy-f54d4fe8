/**
 * Resolve a localized field from a database row.
 * Tries `<field>_<lang>`, then `<field>_en`, then bare `<field>`, then ''.
 *
 * Example:
 *   getLocalized(topicRow, 'title', 'ru')
 *   → topicRow.title_ru ?? topicRow.title_en ?? topicRow.title ?? ''
 */
export function getLocalized<T extends Record<string, unknown>>(
  row: T | null | undefined,
  field: string,
  language: string,
): string {
  if (!row) return '';
  const langKey = `${field}_${language}`;
  const enKey = `${field}_en`;
  const v =
    (row[langKey] as string | null | undefined) ??
    (row[enKey] as string | null | undefined) ??
    (row[field] as string | null | undefined) ??
    '';
  return typeof v === 'string' ? v : '';
}
