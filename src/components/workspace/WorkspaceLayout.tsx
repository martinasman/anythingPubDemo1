'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ChatPanel from './ChatPanel';
import ContextPanel from './ContextPanel';
import Toolbar from './Toolbar';

interface WorkspaceLayoutProps {
  projectId: string;
}

export default function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  return (
    <div className="h-screen w-full flex flex-col">
      {/* Top Toolbar */}
      <Toolbar projectName={`Project ${projectId}`} />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Chat (narrower) */}
          <Panel defaultSize={28} minSize={15} maxSize={40}>
            <ChatPanel projectName={`Project ${projectId}`} />
          </Panel>

          {/* Invisible Resize Handle */}
          <PanelResizeHandle className="w-1 hover:bg-zinc-300 dark:hover:bg-slate-600 transition-colors" />

          {/* Right Panel - Context/Canvas */}
          <Panel defaultSize={72} minSize={50}>
            <ContextPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
