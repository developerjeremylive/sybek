// ---------------------------------------------------------------------------
// OpenBrowserClaw — Layout shell
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router';
import { MessageSquare, FolderOpen, Clock, Settings, LayoutGrid, Wrench, GripVertical, Bot, MoreHorizontal } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.js';
import { FileViewerModal } from '../files/FileViewerModal.js';
import { useFileViewerStore } from '../../stores/file-viewer-store.js';
import { useLayoutStore, type ColumnLayout } from '../../stores/layout-store.js';
import { ChatPage } from '../chat/ChatPage.js';
import { FilesPage } from '../files/FilesPage.js';
import { AgentsPage } from '../agents/AgentsPage.js';

const mainNavItems = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/agents', label: 'Agents', icon: Bot },
] as const;

const moreNavItems = [
  { to: '/tasks', label: 'Tasks', icon: Clock },
  { to: '/skills', label: 'Skills', icon: Wrench },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

const columnButtons: { cols: ColumnLayout; icon: typeof LayoutGrid; label: string; color: string }[] = [
  { cols: 1, icon: LayoutGrid, label: '1', color: 'bg-blue-500' },
  { cols: 2, icon: LayoutGrid, label: '2', color: 'bg-purple-500' },
  { cols: 3, icon: LayoutGrid, label: '3', color: 'bg-green-500' },
];

// ResizeHandle component for dragging column dividers
function ResizeHandle({ onResize, index }: { onResize: (delta: number) => void; index: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      startX.current = e.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={containerRef}
      className="w-1 hover:w-1.5 bg-base-300 hover:bg-primary cursor-col-resize transition-colors flex-shrink-0 relative group"
      onMouseDown={handleMouseDown}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-primary text-primary-content rounded p-0.5">
        <GripVertical className="w-3 h-3" />
      </div>
    </div>
  );
}

export function Layout() {
  const viewerFile = useFileViewerStore((s) => s.file);
  const closeFile = useFileViewerStore((s) => s.closeFile);
  const { columns, columnWidths, setColumns, setColumnWidths } = useLayoutStore();

  // Handle column resize
  const handleResize = (index: number, delta: number) => {
    const container = document.getElementById('columns-container');
    if (!container) return;
    
    const containerWidth = container.offsetWidth;
    const deltaPercent = (delta / containerWidth) * 100;
    
    const newWidths = [...columnWidths];
    
    // Adjust the column being resized and its neighbor
    if (index > 0) {
      newWidths[index - 1] = Math.max(20, Math.min(80, newWidths[index - 1] + deltaPercent));
    }
    if (index < newWidths.length - 1) {
      newWidths[index] = Math.max(20, Math.min(80, newWidths[index] - deltaPercent));
    }
    
    // Normalize to 100%
    const total = newWidths.reduce((a, b) => a + b, 0);
    const normalized = newWidths.map(w => (w / total) * 100);
    
    setColumnWidths(normalized);
  };

  const showTabs = columns === 1;

  return (
    <div className="flex flex-col h-screen h-[100dvh]">
      {/* Desktop Top navbar - hidden on mobile */}
      <div className="navbar bg-base-200 border-b border-base-300 safe-area-top px-4 min-h-14 hidden sm:flex">
        <div className="navbar-start flex items-center gap-2">
          {/* Chat history toggle button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-chat-history'))}
            className="btn btn-ghost btn-sm btn-circle"
            title="Historial de chats"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          
          <span className="text-xl font-bold select-none flex items-center gap-1.5">
            <span className="text-lg">🦀</span>
            <span className="hidden sm:inline">BuilderLiveApp</span>
          </span>
        </div>

        {/* Column layout buttons */}
        <div className="navbar-center flex gap-1">
          {columnButtons.map(({ cols, icon: Icon, label, color }) => (
            <button
              key={cols}
              onClick={() => setColumns(cols)}
              className={`btn btn-sm gap-1 ${columns === cols ? color + ' text-white' : 'btn-ghost'}`}
              title={`${cols} columna${cols > 1 ? 's' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>

        {/* Desktop tabs - only show in 1 column mode */}
        {showTabs && (
          <div className="navbar-end flex items-center gap-2">
            {/* Chat history toggle button */}
            <button
              onClick={() => {
                // Dispatch custom event to toggle chat history
                window.dispatchEvent(new CustomEvent('toggle-chat-history'));
              }}
              className="btn btn-ghost btn-sm btn-circle"
              title="Historial de chats"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            
            <div role="tablist" className="tabs tabs-box">
              {mainNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  role="tab"
                  className={({ isActive }: { isActive: boolean }) =>
                    `tab gap-1.5 ${isActive ? 'tab-active' : ''}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </div>
            
            {/* More dropdown */}
            <div className="dropdown dropdown-end ml-2">
              <label tabIndex={0} className="btn btn-ghost btn-sm gap-1">
                <MoreHorizontal className="w-4 h-4" />
                Más
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52 border border-base-300">
                {moreNavItems.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Theme toggle for desktop */}
        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile floating icon - only visible on mobile */}
      <div className="sm:hidden fixed top-2 left-2 z-50">
        <div className="w-10 h-10 bg-base-200 rounded-full flex items-center justify-center shadow-lg border border-base-300">
          <span className="text-xl">🦀</span>
        </div>
      </div>

      {/* ---- Page content ---- */}
      <main id="columns-container" className="flex-1 overflow-hidden pb-16 sm:pb-0">
        {columns === 1 ? (
          <Outlet />
        ) : columns === 2 ? (
          <div className="flex h-full">
            <div style={{ width: `${columnWidths[0]}%` }} className="h-full overflow-hidden">
              <ChatPage />
            </div>
            <ResizeHandle onResize={(delta) => handleResize(0, delta)} index={0} />
            <div style={{ width: `${columnWidths[1]}%` }} className="h-full overflow-hidden">
              <FilesPage />
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            <div style={{ width: `${columnWidths[0]}%` }} className="h-full overflow-hidden">
              <ChatPage />
            </div>
            <ResizeHandle onResize={(delta) => handleResize(0, delta)} index={0} />
            <div style={{ width: `${columnWidths[1]}%` }} className="h-full overflow-hidden">
              <FilesPage />
            </div>
            <ResizeHandle onResize={(delta) => handleResize(1, delta)} index={1} />
            <div style={{ width: `${columnWidths[2]}%` }} className="h-full overflow-hidden">
              <AgentsPage />
            </div>
          </div>
        )}
      </main>

      {/* Mobile floating toggle button */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-chat-history'))}
        className="sm:hidden btn btn-primary btn-circle fixed top-4 right-4 z-40 shadow-lg"
        title="Historial de chats"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* ---- Mobile bottom nav ---- */}
      <div className="dock sm:hidden">
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }: { isActive: boolean }) => (isActive ? 'dock-active' : '')}
          >
            <Icon className="w-5 h-5" />
            <span className="dock-label">{label}</span>
          </NavLink>
        ))}
        
        {/* More button for mobile */}
        <div className="dropdown dropdown-top dropdown-end">
          <label tabIndex={0} className="dock-label flex flex-col items-center gap-0.5 cursor-pointer">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">Más</span>
          </label>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52 border border-base-300 mb-2">
            {moreNavItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---- Global file viewer modal ---- */}
      {viewerFile && (
        <FileViewerModal
          name={viewerFile.name}
          content={viewerFile.content}
          onClose={closeFile}
        />
      )}
    </div>
  );
}
