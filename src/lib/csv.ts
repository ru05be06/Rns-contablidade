export function toCsv(rows: Record<string, unknown>[], columns: { key: string; header: string }[]) {
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",;\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = columns.map((c) => escape(c.header)).join(";");
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(";"));
  return [header, ...lines].join("\n");
}
