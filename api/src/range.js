// Single byte ranges only. Reject malformed/multiple/unsatisfiable ranges.
export function byteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  const invalid = () => {
    throw Object.assign(new Error('Invalid byte range'), { status: 416 });
  };
  if (!match || (!match[1] && !match[2])) return invalid();
  let start, end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return invalid();
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start >= size ||
      end < start
    )
      return invalid();
    end = Math.min(end, size - 1);
  }
  return { start, end };
}
