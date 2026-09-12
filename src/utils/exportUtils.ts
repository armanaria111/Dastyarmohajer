/**
 * Utility to export datasets to clean CSV with UTF-8 BOM so Persian characters
 * open flawlessly in Excel and Google Sheets without font corruption.
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const escapeCell = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  // Add headers
  csvRows.push(headers.map(escapeCell).join(","));

  // Add rows
  for (const row of rows) {
    csvRows.push(row.map(escapeCell).join(","));
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel recognizes Persian/Arabic encoding
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
