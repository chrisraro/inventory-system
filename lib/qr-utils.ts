/**
 * Utility functions for QR code processing
 */

/**
 * Extracts the last alphanumeric word from a QR code string
 * Handles cases like "Q.C PASSED   05285AWI1ES04" -> "05285AWI1ES04"
 * @param qrData - The raw QR code data
 * @returns The last alphanumeric word or the original string if no words found
 */
export function extractLastAlphanumericWord(qrData: string): string {
  if (!qrData || typeof qrData !== 'string') {
    return qrData || '';
  }

  // Trim whitespace
  const trimmedData = qrData.trim();
  
  // If empty after trimming, return as is
  if (!trimmedData) {
    return qrData;
  }

  // Split by whitespace and get all parts
  const parts = trimmedData.split(/\s+/);
  
  // Work backwards through the parts to find the last alphanumeric word
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    // Check if this part contains alphanumeric characters
    if (/[a-zA-Z0-9]/.test(part)) {
      // Remove any non-alphanumeric characters from the beginning and end
      // but preserve alphanumeric characters and internal special characters
      const cleaned = part.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      if (cleaned) {
        return cleaned;
      }
      // If cleaning removed everything, return the original part if it has alphanumeric chars
      return part;
    }
  }

  // If no alphanumeric parts found, return the last part
  return parts[parts.length - 1];
}

/**
 * Validates if a string contains alphanumeric characters
 * @param str - The string to validate
 * @returns True if the string contains at least one alphanumeric character
 */
export function hasAlphanumericCharacters(str: string): boolean {
  return /[a-zA-Z0-9]/.test(str);
}

/**
 * Normalizes QR code data by extracting the product identifier
 * @param qrData - The raw QR code data
 * @returns The normalized product identifier
 */
export function normalizeQRCode(qrData: string): string {
  // Extract the last alphanumeric word
  const productIdentifier = extractLastAlphanumericWord(qrData);
  
  // Return the cleaned identifier
  return productIdentifier;
}