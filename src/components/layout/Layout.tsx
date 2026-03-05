// ---------------------------------------------------------------------------
// OpenBrowserClaw — Layout shell
// ---------------------------------------------------------------------------

import { Outlet, NavLink } from 'react-router';
import { MessageSquare, FolderOpen, Clock, Settings, LayoutGrid } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.js';
import { FileViewerModal } from '../files/FileViewerModal.js';
import { useFileViewerStore } from '../../stores/file-viewer-store.js';
import { useLayoutStore, type ColumnLayout } from '../../stores/layout-store.js';
import { ChatPage } from '../chat/ChatPage.js';
import { FilesPage } from '../files/FilesPage.js';
import { AgentsPage } from '../agents/AgentsPage.js';

const navItems = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/tasks', label: 'Tasks', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

const columnButtons: { cols: ColumnLayout; icon: typeof LayoutGrid; label: string; color: string }[] = [
  { cols: 1, icon: LayoutGrid, label: '1', color: 'bg-blue-500' },
  { cols: 2, icon: LayoutGrid, label: '2', color: 'bg-purple-500' },
  { cols: 3, icon: LayoutGrid, label: '3', color: 'bg-green-500' },
];

export function Layout() {
  const viewerFile = useFileViewerStore((s) => s.file);
  const closeFile = useFileViewerStore((s) => s.closeFile);
  const { columns, setColumns } = useLayoutStore();

  return (
    <div className="flex flex-col h-screen h-[100dvh]">
      {/* ---- Top navbar ---- */}
      <div className="navbar bg-base-200 border-b border-base-300 safe-area-top px-4 min-h-14">
        <div className="navbar-start">
          <span className="text-xl font-bold select-none flex items-center gap-1.5">
            <span className="text-lg">🦀</span>
            <span className="hidden sm:inline">OpenBrowserClaw</span>
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

        {/* Desktop tabs */}
        <div className="navbar-end hidden sm:flex">
          <div role="tablist" className="tabs tabs-box">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                role="tab"
                className={({ isActive }) =>
                  `tab gap-1.5 ${isActive ? 'tab-active' : ''}`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="navbar-end sm:hidden">
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Page content ---- */}
      <main className="flex-1 overflow-hidden pb-16 sm:pb-0">
        {columns === 1 ? (
          <Outlet />
        ) : columns === 2 ? (
          <div className="flex h-full">
            <div className="w-1/2 border-r border-base-300">
              <ChatPage />
            </div>
            <div className="w-1/2">
              <FilesPage />
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            <div className="w-1/3 border-r border-base-300">
              <ChatPage />
            </div>
            <div className="w-1/3 border-r border-base-300">
              <FilesPage />
            </div>
            <div className="w-1/3">
              <AgentsPage />
            </div>
          </div>
        )}
      </main>

      {/* ---- Mobile bottom nav ---- */}
      <div className="dock sm:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? 'dock-active' : '')}
          >
            <Icon className="w-5 h-5" />
            <span className="dock-label">{label}</span>
          </NavLink>
        ))}
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
