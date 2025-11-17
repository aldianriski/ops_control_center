import Papa from 'papaparse';
import toast from 'react-hot-toast';

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param columns Optional array of column names to include (in order)
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: (keyof T)[]
): void => {
  try {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Filter columns if specified
    const filteredData = columns
      ? data.map((row) => {
          const filteredRow: Partial<T> = {};
          columns.forEach((col) => {
            filteredRow[col] = row[col];
          });
          return filteredRow;
        })
      : data;

    // Convert to CSV
    const csv = Papa.unparse(filteredData, {
      header: true,
      skipEmptyLines: true,
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${data.length} rows to ${filename}.csv`);
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export data');
  }
};

/**
 * Export data to JSON file
 * @param data Data to export
 * @param filename Name of the file (without extension)
 */
export const exportToJSON = (data: any, filename: string): void => {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported data to ${filename}.json`);
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export data');
  }
};

/**
 * Format date for export
 */
export const formatDateForExport = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format datetime for export
 */
export const formatDateTimeForExport = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').split('.')[0];
};
