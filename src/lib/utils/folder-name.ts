/**
 * Sanitizes a string to be a valid folder name across all major operating systems.
 * Removes invalid characters and handles edge cases while preserving spaces.
 * Also escapes characters that have special meaning in command line contexts.
 * 
 * @param input - The string to sanitize
 * @returns A sanitized string that can be safely used as a folder name and in command line arguments
 */
export function sanitizeFolderName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove characters that are invalid in Windows, macOS, and Linux
  // Windows has the most restrictions, so we're using those as a baseline
  let sanitized = input
    // Remove characters not allowed in filenames across platforms
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '')
    // Replace dots with underscores (dots at beginning/end can be problematic)
    .replace(/^\.+|\.+$/g, '_')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Remove leading/trailing spaces
    .trim();

  // Handle reserved names in Windows (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  if (reservedNames.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }

  // If the name is empty after sanitization, provide a default
  if (!sanitized) {
    sanitized = 'Dynbox Vault';
  }

  // Trim to a reasonable length (255 is the max for most filesystems)
  sanitized = sanitized.slice(0, 255);
  
  // Escape characters that have special meaning in command line contexts
  // This includes spaces, parentheses, brackets, braces, quotes, backticks, dollar signs, etc.
  return sanitized.replace(/([&\s!#$^()[\]{}*|;'<>?,`~])/g, '\\$1');
}
