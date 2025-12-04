'use client';

import { useProjectStore } from '@/store/projectStore';
import { ArrowLeft, Users, Mail, Phone, Globe, Badge, TrendingUp } from 'lucide-react';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import type { Client } from '@/types/database';

export default function ClientsView() {
  const { artifacts, setCanvasState } = useProjectStore();
  const { bgStyle, isDark } = useCanvasBackground();

  const crm = artifacts.crm;
  const clients = crm?.clients || [];

  // Dynamic styling
  const cardBg = isDark ? 'bg-zinc-900' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      prospect: {
        bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
        text: isDark ? 'text-blue-300' : 'text-blue-700',
      },
      active: {
        bg: isDark ? 'bg-green-900/30' : 'bg-green-100',
        text: isDark ? 'text-green-300' : 'text-green-700',
      },
      onboarding: {
        bg: isDark ? 'bg-purple-900/30' : 'bg-purple-100',
        text: isDark ? 'text-purple-300' : 'text-purple-700',
      },
      paused: {
        bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100',
        text: isDark ? 'text-orange-300' : 'text-orange-700',
      },
      churned: {
        bg: isDark ? 'bg-red-900/30' : 'bg-red-100',
        text: isDark ? 'text-red-300' : 'text-red-700',
      },
      archived: {
        bg: isDark ? 'bg-zinc-700/30' : 'bg-zinc-100',
        text: isDark ? 'text-zinc-300' : 'text-zinc-600',
      },
    };
    return colors[status] || colors.prospect;
  };

  // Empty state
  if (!crm || clients.length === 0) {
    return (
      <div className="h-full flex flex-col" style={bgStyle}>
        <div className={`px-6 py-4 border-b ${borderColor} ${cardBg}`}>
          <button
            onClick={() => setCanvasState({ type: 'overview' })}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm ${textSecondary} hover:${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-2xl border-2 border-dashed ${borderColor} flex items-center justify-center mb-4 mx-auto`}>
              <Users size={40} className={isDark ? 'text-zinc-600' : 'text-zinc-300'} />
            </div>
            <h3 className={`text-xl font-semibold ${textSecondary} mb-2`}>No Clients Yet</h3>
            <p className={`text-sm ${textSecondary} text-center max-w-sm`}>
              Convert leads to clients or add them manually to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={bgStyle}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between shrink-0 ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} flex items-center justify-center`}>
            <Users size={20} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>
              Your Clients
            </h3>
            <p className={`text-xs ${textSecondary}`}>
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCanvasState({ type: 'overview' })}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm ${textSecondary} hover:${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-lg transition-colors`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Metrics */}
      {crm.metrics && (
        <div className={`px-6 py-3 border-b ${borderColor} ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'} grid grid-cols-3 gap-4`}>
          <div>
            <p className={`text-xs ${textSecondary} mb-1`}>Active Clients</p>
            <p className={`text-xl font-bold ${textPrimary}`}>{crm.metrics.activeClients}</p>
          </div>
          <div>
            <p className={`text-xs ${textSecondary} mb-1`}>Total Clients</p>
            <p className={`text-xl font-bold ${textPrimary}`}>{crm.metrics.totalClients}</p>
          </div>
          <div>
            <p className={`text-xs ${textSecondary} mb-1`}>Pipeline Value</p>
            <p className={`text-lg font-bold text-green-500`}>
              ${(crm.metrics.pipelineValue / 1000).toFixed(1)}k
            </p>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className={`sticky top-0 ${isDark ? 'bg-zinc-800 border-b border-zinc-700' : 'bg-zinc-50 border-b border-zinc-200'}`}>
            <tr>
              <th className={`px-6 py-3 text-left font-semibold ${textPrimary}`}>Company</th>
              <th className={`px-6 py-3 text-left font-semibold ${textPrimary}`}>Status</th>
              <th className={`px-6 py-3 text-left font-semibold ${textPrimary}`}>Contact</th>
              <th className={`px-6 py-3 text-left font-semibold ${textPrimary}`}>Value</th>
              <th className={`px-6 py-3 text-left font-semibold ${textPrimary}`}>Industry</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className={`border-b ${borderColor} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
              >
                {/* Company Name */}
                <td className={`px-6 py-4 font-medium ${textPrimary}`}>
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="font-medium">{client.companyName}</p>
                      {client.primaryContact?.name && (
                        <p className={`text-xs ${textSecondary}`}>{client.primaryContact.name}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                      getStatusColor(client.status).bg
                    } ${getStatusColor(client.status).text}`}
                  >
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </td>

                {/* Contact Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {client.primaryContact?.email && (
                      <a
                        href={`mailto:${client.primaryContact.email}`}
                        className={`${textSecondary} hover:${isDark ? 'text-blue-400' : 'text-blue-600'} transition-colors`}
                        title={client.primaryContact.email}
                      >
                        <Mail size={16} />
                      </a>
                    )}
                    {client.primaryContact?.phone && (
                      <a
                        href={`tel:${client.primaryContact.phone}`}
                        className={`${textSecondary} hover:${isDark ? 'text-blue-400' : 'text-blue-600'} transition-colors`}
                        title={client.primaryContact.phone}
                      >
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                </td>

                {/* Lifetime Value */}
                <td className={`px-6 py-4 font-medium ${textPrimary}`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-green-500" />
                    <span>${(client.financialMetrics?.lifetimeValue || 0).toLocaleString()}</span>
                  </div>
                </td>

                {/* Industry */}
                <td className={`px-6 py-4 ${textSecondary}`}>
                  {client.industry ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      isDark ? 'bg-zinc-700' : 'bg-zinc-100'
                    }`}>
                      <Badge size={12} />
                      {client.industry}
                    </span>
                  ) : (
                    <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
