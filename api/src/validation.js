export function title(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw Object.assign(new Error(`Title must be 1–${max} characters`), {
      status: 400,
    });
  return value.trim();
}

export function description(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 5000)
    throw Object.assign(
      new Error('Description must be 5000 characters or fewer'),
      { status: 400 },
    );
  return value.trim();
}

export function slug(value) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'untitled'
  );
}

export function uuid(value) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value || '',
    )
  )
    throw Object.assign(new Error('Invalid ID'), { status: 400 });
  return value;
}
