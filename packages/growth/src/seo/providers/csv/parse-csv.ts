export type CsvRecord = Record<string, string>;

export function parseCsvRecords(input: string): CsvRecord[] {
  const rows = parseCsvRows(input);
  const [headers, ...bodyRows] = rows;
  if (!headers || headers.length === 0) {
    return [];
  }

  return bodyRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const record: CsvRecord = {};
      headers.forEach((header, index) => {
        record[header.trim()] = row[index]?.trim() ?? '';
      });
      return record;
    });
}

export function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let insideQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((candidateRow) => candidateRow.some((candidateCell) => candidateCell !== ''));
}
