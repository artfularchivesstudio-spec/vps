// 🎭 **Export State Management** - The Living Canvas of Export Progress ✨
// Where the ephemeral journey of database exports is meticulously tracked.

interface ExportStatusEntry {
  progress: number;
  status: string;
  completed: boolean;
  error?: string;
  downloadUrl?: string;
  size?: string;
}

// 🎼 This Map serves as our in-memory ledger for all active export jobs.
// In a grander, production-scale symphony, this would harmonize with a persistent store like Redis or a database
// to ensure state endures beyond a single performance.
const activeExports = new Map<string, ExportStatusEntry>();

// 🎨 Functions to interact with our export ledger
export const getExportStatus = (exportId: string) => {
  return activeExports.get(exportId);
};

export const setExportStatus = (exportId: string, status: ExportStatusEntry) => {
  activeExports.set(exportId, status);
};

export const deleteExport = (exportId: string) => {
  const exportEntry = activeExports.get(exportId);
  if (exportEntry && exportEntry.downloadUrl) {
    // 🖼️ Revoke the temporary URL to prevent memory leaks in the browser
    URL.revokeObjectURL(exportEntry.downloadUrl);
  }
  activeExports.delete(exportId);
};

// 📊 Export the raw Map for direct manipulation in the main export route (carefully, like a surgeon!)
export { activeExports };
