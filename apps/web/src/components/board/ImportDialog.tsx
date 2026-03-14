import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, cn } from '@chorechamp/ui';
import { useImportChores } from '@chorechamp/api-client';

interface ImportDialogProps {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface PreviewRow {
  title?: string;
  category?: string;
  pointValue?: string | number;
  difficulty?: string;
  [key: string]: unknown;
}

export function ImportDialog({ householdId, open, onOpenChange }: ImportDialogProps) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<'csv' | 'json' | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importChores = useImportChores(householdId);

  const reset = () => {
    setFileContent(null);
    setFileName(null);
    setDetectedFormat(null);
    setPreviewRows([]);
    setResult(null);
  };

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      setFileName(file.name);

      const trimmed = text.trim();
      const isJSON = trimmed.startsWith('[') || trimmed.startsWith('{');
      const format = isJSON ? 'json' : 'csv';
      setDetectedFormat(format);

      let rows: PreviewRow[] = [];
      if (isJSON) {
        try {
          const parsed = JSON.parse(trimmed);
          rows = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          rows = [];
        }
      } else {
        const lines = trimmed.split(/\r?\n/).filter(l => l.trim());
        if (lines.length >= 2) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: PreviewRow = {};
            headers.forEach((h, j) => { row[h] = values[j] ?? ''; });
            rows.push(row);
          }
        }
      }

      setPreviewRows(rows.slice(0, 5));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleImport = async () => {
    if (!fileContent || !detectedFormat) return;

    const res = await importChores.mutateAsync({
      content: fileContent,
      format: detectedFormat,
    });
    setResult(res);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const previewColumns = previewRows.length > 0
    ? Object.keys(previewRows[0]).slice(0, 5)
    : [];

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
          data-testid="import-dialog"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Import Chores
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Imported {result.imported} chore{result.imported !== 1 ? 's' : ''}
                </span>
              </div>
              {result.skipped > 0 && (
                <p className="text-sm text-amber-600">
                  {result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped due to validation errors.
                </p>
              )}
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-3">
                  <ul className="space-y-1 text-xs text-red-700">
                    {result.errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <Button size="sm" onClick={() => handleClose(false)}>Done</Button>
              </div>
            </div>
          ) : (
            <>
              {!fileContent ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
                    dragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  )}
                >
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    Drop a CSV or JSON file here
                  </p>
                  <p className="mt-1 text-xs text-gray-500">or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="flex-1 text-sm text-gray-700 truncate">{fileName}</span>
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600 uppercase">
                      {detectedFormat}
                    </span>
                    <button
                      onClick={reset}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-200"
                      aria-label="Remove file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {previewRows.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preview (first {previewRows.length} row{previewRows.length !== 1 ? 's' : ''})
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              {previewColumns.map((col) => (
                                <th key={col} className="px-2 py-1.5 text-left font-medium text-gray-600">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                {previewColumns.map((col) => (
                                  <td key={col} className="max-w-[120px] truncate px-2 py-1.5 text-gray-700">
                                    {String(row[col] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </Dialog.Close>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={!fileContent || importChores.isPending}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {importChores.isPending ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
