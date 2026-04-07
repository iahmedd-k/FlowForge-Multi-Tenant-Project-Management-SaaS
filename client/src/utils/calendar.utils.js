/**
 * Download an ICS file from a blob response
 * @param {Blob} blob - The ICS file blob
 * @param {String} filename - The filename for the download
 */
export const downloadICS = (blob, filename = 'flowforge.ics') => {
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Append to body and click
  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Copy calendar feed URL to clipboard
 * @param {String} url - The calendar feed URL to copy
 * @returns {Promise<Boolean>} - True if copy was successful
 */
export const copyCalendarFeedUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};
