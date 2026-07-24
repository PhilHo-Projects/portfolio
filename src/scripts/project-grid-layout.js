/**
 * Convert a computed grid-template-columns value into the number of active
 * card columns. Browsers return resolved track sizes such as "320px 320px".
 *
 * @param {string} template
 * @returns {number}
 */
export function gridColumnCount(template) {
  const tracks = template.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, tracks.length);
}

/**
 * Find the final card index in the trigger's visual row without relying on
 * offset measurements that an already-open full-width panel can distort.
 *
 * @param {number} triggerIndex
 * @param {number} columnCount
 * @param {number} tileCount
 * @returns {number}
 */
export function projectRowEndIndex(triggerIndex, columnCount, tileCount) {
  if (tileCount <= 0) return -1;
  const safeColumns = Math.max(1, columnCount);
  const rowStart = Math.floor(triggerIndex / safeColumns) * safeColumns;
  return Math.min(tileCount - 1, rowStart + safeColumns - 1);
}
