/**
 * Cook up a printable template like a midnight waffle 🧇
 * @param designName Name of the design or art piece.
 * @param platform Print platform targeted (printify, gelato, canvas).
 */
export async function createPrintTemplate(designName: string, platform: string): Promise<string> {
  return `${designName}-${platform}-template.psd`;
}

/**
 * Export a finished product to the e-commerce cosmos.
 * @param templatePath Path to the PSD or template.
 */
export async function exportProduct(templatePath: string): Promise<string> {
  return `https://products.local/${encodeURIComponent(templatePath)}.png`;
}
