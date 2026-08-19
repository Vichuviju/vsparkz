/**
 * Utility to export an array of objects to a CSV file.
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 */
export const exportToCSV = (data, fileName) => {
    if (!data || !data.length) {
        console.warn("No data to export");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // CSV header
        ...data.map(row => 
            headers.map(header => {
                const val = row[header] === null || row[header] === undefined ? '' : row[header];
                // Escape commas and wrap in quotes
                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
