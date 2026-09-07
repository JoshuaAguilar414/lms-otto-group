export type CsvColumn = { key: string; label: string };

export function downloadCsv(
  filename: string,
  columns: CsvColumn[],
  rows: Array<Record<string, string>>
): void {
  const escape = (value: string) => {
    const text = value ?? "";
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const header = columns.map((column) => escape(column.label)).join(",");
  const lines = rows.map((row) => columns.map((column) => escape(row[column.key] ?? "")).join(","));
  const csv = `\uFEFF${[header, ...lines].join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function csvFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
