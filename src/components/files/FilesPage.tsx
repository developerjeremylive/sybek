// ---------------------------------------------------------------------------
// OpenBrowserClaw — Files page
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import {
  Folder, Globe, Image, FileText, FileCode, FileJson, FileSpreadsheet,
  File, Home, Search, Download, Trash2, X, FolderOpen, Pin, PinOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DEFAULT_GROUP_ID } from '../../config.js';
import { listGroupFiles, readGroupFile, deleteGroupFile } from '../../storage.js';
import { FileViewerModal } from './FileViewerModal.js';

interface FileEntry {
  name: string;
  isDir: boolean;
}

// Combine HTML with its CSS and JS files for proper preview
async function combineHtmlWithResources(
  groupId: string,
  htmlContent: string,
  currentDir: string
): Promise<string> {
  let combinedHtml = htmlContent;
  
  // Find and inject CSS files
  const cssRegex = /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi;
  let match;
  const cssFiles: Record<string, string> = {};
  
  while ((match = cssRegex.exec(htmlContent)) !== null) {
    const cssFile = match[1];
    try {
      const cssPath = currentDir ? `${currentDir}/${cssFile}` : cssFile;
      const cssContent = await readGroupFile(groupId, cssPath);
      cssFiles[cssFile] = cssContent;
    } catch {
      console.log('CSS file not found:', cssFile);
    }
  }
  
  // Replace CSS links with inline styles
  for (const [cssFile, cssContent] of Object.entries(cssFiles)) {
    const styleTag = `<style>\n/* From ${cssFile} */\n${cssContent}\n</style>`;
    combinedHtml = combinedHtml.replace(
      new RegExp(`<link[^>]+href=["']${cssFile.replace('/', '\\/')}["'][^>]*>`, 'gi'),
      styleTag
    );
  }
  
  // Find and inject JS files
  const jsRegex = /<script[^>]+src=["']([^"']+\.js)["'][^>]*><\/script>/gi;
  const jsFiles: Record<string, string> = {};
  
  while ((match = jsRegex.exec(htmlContent)) !== null) {
    const jsFile = match[1];
    try {
      const jsPath = currentDir ? `${currentDir}/${jsFile}` : jsFile;
      const jsContent = await readGroupFile(groupId, jsPath);
      jsFiles[jsFile] = jsContent;
    } catch {
      console.log('JS file not found:', jsFile);
    }
  }
  
  // Replace JS script tags with inline scripts
  for (const [jsFile, jsContent] of Object.entries(jsFiles)) {
    const scriptTag = `<script>\n/* From ${jsFile} */\n${jsContent}\n</script>`;
    combinedHtml = combinedHtml.replace(
      new RegExp(`<script[^>]+src=["']${jsFile.replace('/', '\\/')}["'][^>]*><\\/script>`, 'gi'),
      scriptTag
    );
  }
  
  // Add inline script to handle internal anchor links and prevent iframe reload
  const anchorHandler = `
<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Handle anchor links within the page
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = this.getAttribute('href').substring(1);
        var target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    
    // Remove any base tags that might interfere
    document.querySelectorAll('base').forEach(function(el) {
      el.parentNode.removeChild(el);
    });
  });
})();
</script>`;
  
  // Insert the handler before </body>
  if (combinedHtml.includes('</body>')) {
    combinedHtml = combinedHtml.replace('</body>', anchorHandler + '</body>');
  } else {
    combinedHtml += anchorHandler;
  }
  
  return combinedHtml;
}

function getFileIcon(name: string, isDir: boolean): LucideIcon {
  if (isDir) return Folder;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, LucideIcon> = {
    html: Globe, htm: Globe, svg: Globe,
    png: Image, jpg: Image, jpeg: Image, gif: Image,
    md: FileText, txt: FileText,
    json: FileJson,
    js: FileCode, ts: FileCode, css: FileCode, xml: FileCode,
    csv: FileSpreadsheet,
  };
  return icons[ext] ?? File;
}

export function FilesPage() {
  const [path, setPath] = useState<string[]>([]);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [viewerFile, setViewerFile] = useState<{ name: string; content: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pinnedFolders, setPinnedFolders] = useState<Set<string>>(new Set());
  const [contextFolders, setContextFolders] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Get sessionFolder dynamically - recalculates on every refreshKey change
  const getSessionFolder = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('currentSessionFolder') || '';
  };
  
  // Use sessionFolder from localStorage OR first path segment as groupId
  const folderFromPath = path.length > 0 ? path[0] : '';
  const sessionFolder = getSessionFolder();
  const groupId = sessionFolder || folderFromPath || DEFAULT_GROUP_ID;
  const currentDir = path.length > 1 ? path.slice(1).join('/') : '.';

  // Listen for localStorage changes AND custom events to refresh files
  useEffect(() => {
    const handleRefresh = () => setRefreshKey(k => k + 1);
    
    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleRefresh);
    // Listen for custom refresh events (from same tab)
    window.addEventListener('obc-files-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('obc-files-refresh', handleRefresh);
    };
  }, []);

  // Toggle pin for a folder
  function togglePin(folderName: string) {
    setPinnedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      // Save to localStorage
      localStorage.setItem('pinnedFolders', JSON.stringify([...next]));
      return next;
    });
  }

  // Toggle context folder for chat
  function toggleContextFolder(folderName: string) {
    setContextFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      // Save to localStorage
      const arr = [...next].filter(f => f !== currentSessionFolder);
      localStorage.setItem('contextFolders', JSON.stringify(arr));
      return next;
    });
  }

  // Get current session folder
  const currentSessionFolder = typeof window !== 'undefined' 
    ? localStorage.getItem('currentSessionFolder') || ''
    : '';

  // Load pinned folders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pinnedFolders');
    if (saved) {
      try {
        setPinnedFolders(new Set(JSON.parse(saved)));
      } catch {}
    }
    
    // Load context folders
    const savedContext = localStorage.getItem('contextFolders');
    if (savedContext) {
      try {
        setContextFolders(new Set(JSON.parse(savedContext)));
      } catch {}
    }
  }, []);

  // Sort entries: pinned folders first (in pin order), then alphabetical descending
  const sortedEntries = [...entries].sort((a, b) => {
    const aPinned = pinnedFolders.has(a.name);
    const bPinned = pinnedFolders.has(b.name);
    
    // Both are folders
    if (a.isDir && b.isDir) {
      // Pinned first
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // Both pinned or both unpinned: alphabetical descending
      return b.name.localeCompare(a.name);
    }
    
    // Directories first
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    
    return b.name.localeCompare(a.name);
  });

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await listGroupFiles(groupId, currentDir);
      const parsed: FileEntry[] = raw.map((name) => ({
        name: name.replace(/\/$/, ''),
        isDir: name.endsWith('/'),
      }));
      setEntries(parsed);
    } catch (err) {
      if ((err as Error)?.name === 'NotFoundError') {
        setEntries([]);
      } else {
        setError('Failed to load files');
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, currentDir, refreshKey]);

  useEffect(() => {
    loadEntries();
    setPreviewFile(null);
    setPreviewContent(null);
  }, [loadEntries, refreshKey]);

  async function handlePreview(name: string) {
    setPreviewFile(name);
    try {
      const filePath = path.length > 0 ? `${path.join('/')}/${name}` : name;
      const content = await readGroupFile(groupId, filePath);
      
      // If HTML, combine with CSS and JS files
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        const combined = await combineHtmlWithResources(groupId, content, path.join('/'));
        setPreviewContent(combined);
      } else {
        setPreviewContent(content);
      }
    } catch {
      setPreviewContent('[Unable to read file]');
    }
  }

  async function handleDelete(name: string) {
    try {
      const filePath = path.length > 0 ? `${path.join('/')}/${name}` : name;
      await deleteGroupFile(groupId, filePath);
      setDeleteConfirm(null);
      setPreviewFile(null);
      setPreviewContent(null);
      loadEntries();
    } catch {
      setError('Failed to delete file');
    }
  }

  function handleOpenViewer(name: string, content: string) {
    setViewerFile({ name, content });
  }

  function handleDownload(name: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumbs */}
      <div className="px-4 py-2 bg-base-200 border-b border-base-300">
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <button
                className="link link-hover flex items-center gap-1"
                onClick={() => setPath([])}
              >
                <Home className="w-4 h-4" /> workspace
              </button>
            </li>
            {path.map((segment, i) => (
              <li key={i}>
                <button
                  className="link link-hover"
                  onClick={() => setPath(path.slice(0, i + 1))}
                >
                  {segment}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : error ? (
            <div role="alert" className="alert alert-error m-4">{error}</div>
          ) : entries.length === 0 ? (
            <div className="hero py-12">
              <div className="hero-content text-center">
                <div>
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No files yet</p>
                  <p className="text-sm opacity-60 mt-1">Files created by the assistant will appear here</p>
                </div>
              </div>
            </div>
          ) : (
            <table className="table table-sm">
              <tbody>
                {sortedEntries.map((entry) => {
                  const isPinned = entry.isDir && pinnedFolders.has(entry.name);
                  const isContext = entry.isDir && contextFolders.has(entry.name);
                  const isCurrentSession = entry.isDir && entry.name === currentSessionFolder;
                  return (
                  <tr
                    key={entry.name}
                    className={`hover cursor-pointer ${previewFile === entry.name ? 'active' : ''} ${isPinned ? 'bg-primary/10' : ''} ${isContext ? 'bg-success/10' : ''}`}
                    onClick={() =>
                      entry.isDir
                        ? setPath([...path, entry.name])
                        : handlePreview(entry.name)
                    }
                  >
                    {/* Checkbox for context */}
                    {entry.isDir && (
                      <td className="w-8 text-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs checkbox-success"
                          checked={isContext || isCurrentSession}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!isCurrentSession) {
                              toggleContextFolder(entry.name);
                            }
                          }}
                          disabled={isCurrentSession}
                          title={isCurrentSession ? 'Carpeta de sesión actual' : 'Agregar al contexto del chat'}
                        />
                      </td>
                    )}
                    <td className="w-8 text-center">
                      {(() => { const Icon = getFileIcon(entry.name, entry.isDir); return <Icon className={`w-4 h-4 inline-block ${isPinned ? 'text-primary' : ''}`} />; })()}
                    </td>
                    <td className="font-medium">
                      {entry.isDir && (
                        <>
                          <button
                            className={`btn btn-ghost btn-xs mr-1 ${isPinned ? 'text-primary' : 'opacity-30'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(entry.name);
                            }}
                            title={isPinned ? 'Desfijar carpeta' : 'Fijar carpeta'}
                          >
                            {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                          </button>
                          {isCurrentSession && <span className="badge badge-xs badge-success mr-1">chat</span>}
                        </>
                      )}
                      {entry.name}
                      {entry.isDir && (
                        <span className="opacity-30 ml-1">/</span>
                      )}
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          )}
        </div>

        {/* Preview pane (hidden on mobile, shown as modal instead) */}
        {previewFile && previewContent !== null && (
          <div className="hidden md:flex flex-col w-1/2 border-l border-base-300 bg-base-200">
            <div className="flex items-center justify-between px-4 py-2 border-b border-base-300">
              <span className="font-medium text-sm truncate flex items-center gap-1.5">
                {(() => { const Icon = getFileIcon(previewFile, false); return <Icon className="w-4 h-4" />; })()}
                {previewFile}
              </span>
              <div className="flex gap-1">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleOpenViewer(previewFile, previewContent)}
                  title="Open in viewer"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleDownload(previewFile, previewContent)}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => setDeleteConfirm(previewFile)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isRenderable(previewFile) ? (
                <iframe
                  srcDoc={previewContent}
                  className="w-full h-full border-0 rounded bg-white"
                  sandbox="allow-scripts allow-same-origin allow-modals"
                  title={`Preview: ${previewFile}`}
                />
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: preview shows as bottom half (two rows) */}
      {previewFile && previewContent !== null && (
        <div className="md:hidden flex flex-col h-1/2 border-t border-base-300 bg-base-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-base-300 bg-base-100">
            <span className="font-medium text-sm truncate flex items-center gap-1.5">
              {(() => { const Icon = getFileIcon(previewFile, false); return <Icon className="w-4 h-4" />; })()}
              {previewFile}
            </span>
            <div className="flex gap-1">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => handleOpenViewer(previewFile, previewContent)}
                title="Open in viewer"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => handleDownload(previewFile, previewContent)}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={() => setDeleteConfirm(previewFile)}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setPreviewFile(null);
                  setPreviewContent(null);
                }}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {isRenderable(previewFile) ? (
              <iframe
                srcDoc={previewContent}
                className="w-full h-full border-0 rounded bg-white"
                sandbox="allow-scripts allow-same-origin allow-modals"
                title={`Preview: ${previewFile}`}
              />
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {previewContent}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg">Delete file?</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{deleteConfirm}</strong>? This cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDeleteConfirm(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* File viewer modal */}
      {viewerFile && (
        <FileViewerModal
          name={viewerFile.name}
          content={viewerFile.content}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  );
}

function isRenderable(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ['html', 'htm', 'svg'].includes(ext);
}
