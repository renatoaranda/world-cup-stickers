import { Sticker } from './types';

/**
 * Exports current sticker list to a CSV string.
 */
export function exportToCSV(stickers: Sticker[], teamNamesMap: Record<string, string>): string {
  // We use standard comma-separated with quotes, but also support semicolons if needed.
  // Standard format: id,code,teamId,teamName,owned,duplicates,label
  const headers = ['id', 'code', 'teamId', 'teamName', 'owned', 'duplicates', 'label'];
  
  const csvRows = [headers.join(',')];

  for (const s of stickers) {
    const teamName = teamNamesMap[s.teamId] || s.teamId;
    // Escape double quotes inside values
    const escapedTeamName = teamName.includes(',') || teamName.includes('"') 
      ? `"${teamName.replace(/"/g, '""')}"` 
      : teamName;
    const escapedLabel = s.label && (s.label.includes(',') || s.label.includes('"') || s.label.includes('\n'))
      ? `"${s.label.replace(/"/g, '""')}"`
      : s.label || '';

    const row = [
      s.id,
      s.code,
      s.teamId,
      escapedTeamName,
      s.owned ? '1' : '0',
      s.duplicates.toString(),
      escapedLabel
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Triggers a file download in the browser for the generated CSV content.
 */
export function downloadCSV(csvContent: string, fileName: string = 'figurinhas_copa.csv') {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses a CSV string into a list of partial sticker updates or full sticker records.
 * Returns the parsed items or throws an error with a details message.
 */
export function parseCSV(csvText: string): Partial<Sticker>[] {
  if (!csvText || !csvText.trim()) {
    throw new Error('O arquivo CSV está vazio.');
  }

  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error('Nenhuma linha de dados encontrada no CSV.');
  }

  // Detect delimiter: check if first line contains semicolon or comma
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';

  // Parse header
  // Simple CSV line splitter that handles quotes if necessary
  const splitCSVLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delim && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => {
      // Clean leading/trailing quotes and double quotes
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      return val.replace(/""/g, '"');
    });
  };

  const headers = splitCSVLine(headerLine, delimiter).map(h => h.toLowerCase());

  // Find header indexes
  const idIdx = headers.indexOf('id');
  const codeIdx = headers.indexOf('code');
  const ownedIdx = headers.indexOf('owned');
  const duplicatesIdx = headers.indexOf('duplicates');
  const labelIdx = headers.indexOf('label');

  if (idIdx === -1 && codeIdx === -1) {
    throw new Error('O arquivo CSV deve conter pelo menos uma coluna "id" ou "code" para identificar as figurinhas.');
  }

  const parsedStickers: Partial<Sticker>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i], delimiter);
    if (values.length < Math.max(idIdx, codeIdx, ownedIdx, duplicatesIdx, labelIdx)) {
      continue; // Skip malformed rows
    }

    const id = idIdx !== -1 ? values[idIdx] : undefined;
    const code = codeIdx !== -1 ? values[codeIdx] : undefined;
    
    // Fallback ID or code
    const stickerIdentifier = id || code;
    if (!stickerIdentifier) {
      continue; // Skip rows without identifier
    }

    // Parse owned status: could be '1', 'true', 'sim', 'yes', 'owned'
    let owned = false;
    if (ownedIdx !== -1) {
      const ownedVal = values[ownedIdx]?.toLowerCase();
      owned = ownedVal === '1' || ownedVal === 'true' || ownedVal === 'sim' || ownedVal === 's' || ownedVal === 'yes' || ownedVal === 'obtida';
    }

    // Parse duplicates
    let duplicates = 0;
    if (duplicatesIdx !== -1) {
      const dupVal = parseInt(values[duplicatesIdx], 10);
      if (!isNaN(dupVal) && dupVal >= 0) {
        duplicates = dupVal;
      }
    }

    // Parse label
    const label = labelIdx !== -1 ? values[labelIdx] : undefined;

    parsedStickers.push({
      id,
      code,
      owned,
      duplicates,
      label: label || undefined
    });
  }

  return parsedStickers;
}
