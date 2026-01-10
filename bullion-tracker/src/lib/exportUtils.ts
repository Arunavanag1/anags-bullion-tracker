import html2canvas from 'html2canvas';

/**
 * Export a DOM element as a PNG image
 * @param element - The DOM element to capture
 * @param filename - The filename for the download (without extension)
 */
export async function exportChartAsPNG(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });

    // Convert to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Failed to export chart as PNG:', error);
    throw error;
  }
}

/**
 * Escape a value for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Export data as a CSV file
 * @param data - Array of objects to export
 * @param filename - The filename for the download (without extension)
 * @param columns - Optional column order/selection (defaults to all keys from first object)
 */
export function exportDataAsCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: string[]
): void {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Get headers from first object or use provided columns
  const headers = columns || Object.keys(data[0]);

  // Build CSV string
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(escapeCSVValue).join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => escapeCSVValue(row[header]));
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
