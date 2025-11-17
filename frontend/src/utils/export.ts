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

/**
 * Import data from JSON file
 * @param onImport Callback function to handle imported data
 * @param validator Optional validator function to validate data structure
 */
export const importFromJSON = <T = any>(
  onImport: (data: T) => void,
  validator?: (data: any) => boolean
): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';

  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      toast.error('No file selected');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate if validator provided
      if (validator && !validator(data)) {
        toast.error('Invalid file format or structure');
        return;
      }

      onImport(data);
      toast.success(`Imported data from ${file.name}`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import file. Please check the file format.');
    } finally {
      document.body.removeChild(input);
    }
  };

  document.body.appendChild(input);
  input.click();
};

/**
 * Import data from CSV file
 * @param onImport Callback function to handle imported data
 * @param validator Optional validator function to validate data structure
 */
export const importFromCSV = <T extends Record<string, any>>(
  onImport: (data: T[]) => void,
  validator?: (data: T[]) => boolean
): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.style.display = 'none';

  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      toast.error('No file selected');
      return;
    }

    try {
      const text = await file.text();

      Papa.parse<T>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('Parse errors:', results.errors);
            toast.error('Failed to parse CSV file');
            return;
          }

          const data = results.data;

          // Validate if validator provided
          if (validator && !validator(data)) {
            toast.error('Invalid file format or structure');
            return;
          }

          onImport(data);
          toast.success(`Imported ${data.length} rows from ${file.name}`);
        },
        error: (error) => {
          console.error('Parse error:', error);
          toast.error('Failed to parse CSV file');
        },
      });
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import file. Please check the file format.');
    } finally {
      document.body.removeChild(input);
    }
  };

  document.body.appendChild(input);
  input.click();
};
