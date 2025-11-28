'use client';

import { useState, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Users, Target, Mail, Phone, Linkedin, GripVertical } from 'lucide-react';
import { getLeadsWithDummyFallback, getOutreachWithDummyFallback, shouldUseDummyData } from '@/lib/dummyData';
import type { Lead } from '@/types/database';
import EmailModal from './EmailModal';
import CallScriptModal from './CallScriptModal';

// Kanban column definitions
const COLUMNS: { id: Lead['status']; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { id: 'responded', label: 'Responded', color: 'bg-green-500' },
];

export default function CRMFocusView() {
  const { artifacts, runningTools, updateLeadStatus } = useProjectStore();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Lead['status'] | null>(null);
  const [emailModalLead, setEmailModalLead] = useState<Lead | null>(null);
  const [callModalLead, setCallModalLead] = useState<Lead | null>(null);

  const isLeadsLoading = runningTools.has('leads');

  // Use dummy data if no real leads exist
  const leads = getLeadsWithDummyFallback(artifacts.leads);
  const outreach = getOutreachWithDummyFallback(artifacts.outreach, artifacts.leads);
  const usingDummyData = shouldUseDummyData(artifacts.leads);
  const allLeads = leads?.leads || [];

  const getScriptForLead = (leadId: string) => {
    return outreach?.scripts.find(s => s.leadId === leadId);
  };

  // Handler for generating leads
  const handleGenerateLeads = () => {
    window.dispatchEvent(new CustomEvent('autoSubmitPrompt', {
      detail: { prompt: "I want to generate leads for my business. What industry and location should I target?" }
    }));
  };

  // Handler for lead status updates
  const handleUpdateLeadStatus = (leadId: string, status: Lead['status']) => {
    if (!usingDummyData) {
      updateLeadStatus(leadId, status);
    } else {
      console.log('[CRM] Status change (dummy data):', leadId, status);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: Lead['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: Lead['status']) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== columnId) {
      handleUpdateLeadStatus(draggedLead.id, columnId);
    }
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  // Get leads for a specific column
  const getLeadsForColumn = (status: Lead['status']) => {
    return allLeads.filter(lead => lead.status === status);
  };

  // Empty state
  if (!leads && !isLeadsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Users size={32} className="text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          No Leads Yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6 max-w-xs">
          Generate leads to start building your sales pipeline
        </p>
        <button
          onClick={handleGenerateLeads}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl transition-colors"
        >
          <Target size={20} />
          Generate 10 Leads
        </button>
      </div>
    );
  }

  // Loading state
  if (isLeadsLoading && !leads) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700 mb-4" />
        <div className="w-32 h-5 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
        <div className="w-48 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Users size={20} className="text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Your Pipeline
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {allLeads.length} {allLeads.length === 1 ? 'prospect' : 'prospects'} · Drag to move
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerateLeads}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg transition-colors"
        >
          <Target size={16} />
          Generate More
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(column => {
            const columnLeads = getLeadsForColumn(column.id);
            const isOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={`w-80 flex flex-col rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border transition-colors ${
                  isOver
                    ? 'border-zinc-400 dark:border-zinc-500 bg-zinc-100 dark:bg-zinc-800/50'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                      {column.label}
                    </span>
                    <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                      {columnLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {columnLeads.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-xs">
                      Drop leads here
                    </div>
                  ) : (
                    columnLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isDragging={draggedLead?.id === lead.id}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        onEmail={() => setEmailModalLead(lead)}
                        onCall={() => setCallModalLead(lead)}
                        hasScript={!!getScriptForLead(lead.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email Modal */}
      {emailModalLead && getScriptForLead(emailModalLead.id) && (
        <EmailModal
          isOpen={!!emailModalLead}
          onClose={() => setEmailModalLead(null)}
          lead={emailModalLead}
          script={getScriptForLead(emailModalLead.id)!}
        />
      )}

      {/* Call Script Modal */}
      {callModalLead && getScriptForLead(callModalLead.id) && (
        <CallScriptModal
          isOpen={!!callModalLead}
          onClose={() => setCallModalLead(null)}
          lead={callModalLead}
          script={getScriptForLead(callModalLead.id)!}
        />
      )}
    </div>
  );
}

// =============================================================================
// LEAD CARD COMPONENT
// =============================================================================

interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEmail: () => void;
  onCall: () => void;
  hasScript: boolean;
}

function LeadCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
  onEmail,
  onCall,
  hasScript,
}: LeadCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      {/* Header with drag handle */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical size={14} className="text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-zinc-900 dark:text-white truncate">
            {lead.companyName}
          </h4>
          {lead.contactEmail && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {lead.contactEmail}
            </p>
          )}
        </div>
        <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
          {lead.score}/10
        </div>
      </div>

      {/* Industry */}
      {lead.industry && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 truncate">
          {lead.industry}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-700">
        <button
          onClick={(e) => { e.stopPropagation(); onEmail(); }}
          disabled={!lead.contactEmail}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={lead.contactEmail ? 'Send Email' : 'No email available'}
        >
          <Mail size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCall(); }}
          disabled={!hasScript}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={hasScript ? 'View Call Script' : 'Generate scripts first'}
        >
          <Phone size={14} />
        </button>
        {lead.contactLinkedIn && (
          <a
            href={lead.contactLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="View LinkedIn"
          >
            <Linkedin size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
