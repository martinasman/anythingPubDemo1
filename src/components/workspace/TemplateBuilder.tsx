'use client';

import { useState, useCallback, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import {
  Upload,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  Search,
  X,
  Sparkles,
  Users,
  Globe,
  Download,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import type { TemplateArtifact, Lead } from '@/types/database';

// Industry options
const INDUSTRIES = [
  { id: 'plumbers', label: 'Plumbers' },
  { id: 'electricians', label: 'Electricians' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'roofers', label: 'Roofers' },
  { id: 'landscapers', label: 'Landscapers' },
  { id: 'dentists', label: 'Dentists' },
  { id: 'chiropractors', label: 'Chiropractors' },
  { id: 'gyms', label: 'Gyms' },
  { id: 'yoga-studios', label: 'Yoga Studios' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'cafes', label: 'Cafes' },
  { id: 'salons', label: 'Salons' },
  { id: 'barbers', label: 'Barbers' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'lawyers', label: 'Lawyers' },
  { id: 'accountants', label: 'Accountants' },
  { id: 'auto-repair', label: 'Auto Repair' },
  { id: 'cleaning-services', label: 'Cleaning Services' },
  { id: 'photographers', label: 'Photographers' },
  { id: 'other', label: 'Other...' },
];

type Step = 'industry' | 'screenshot' | 'template' | 'leads' | 'generate' | 'export';

interface GeneratedSite {
  leadId: string;
  leadName: string;
  previewToken: string;
  previewUrl: string;
  status: string;
}

export default function TemplateBuilder() {
  const { project, setCanvasState } = useProjectStore();
  const { isDark } = useCanvasBackground();
  const projectId = project?.id;

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('industry');

  // Industry selection
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  // Screenshot upload
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [isUploadDragging, setIsUploadDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template generation
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [template, setTemplate] = useState<TemplateArtifact | null>(null);

  // Leads
  const [location, setLocation] = useState('');
  const [leadCount, setLeadCount] = useState(20);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(true);
  const [isFindingLeads, setIsFindingLeads] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Site generation
  const [isGeneratingSites, setIsGeneratingSites] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedSites, setGeneratedSites] = useState<GeneratedSite[]>([]);

  // Export
  const [copiedAll, setCopiedAll] = useState(false);

  // Dynamic styling
  const cardBg = isDark ? 'bg-zinc-900/80' : 'bg-white/80';
  const cardBorder = isDark ? 'border-zinc-700/50' : 'border-zinc-200/50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const inputBg = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const inputBorder = isDark ? 'border-zinc-700' : 'border-zinc-300';

  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsUploadDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsUploadDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsUploadDragging(false);
  }, []);

  // Generate template
  const handleGenerateTemplate = async () => {
    if (!projectId || !selectedIndustry || !screenshotFile) return;

    setIsGeneratingTemplate(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/xxx;base64, prefix
        };
        reader.readAsDataURL(screenshotFile);
      });

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: `${selectedIndustry === 'other' ? customIndustry : selectedIndustry} Template`,
          industry: selectedIndustry,
          custom_industry: selectedIndustry === 'other' ? customIndustry : undefined,
          screenshot_base64: base64,
          screenshot_mime_type: screenshotFile.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate template');
      }

      const data = await response.json();
      setTemplate(data.template);
      setCurrentStep('leads');
    } catch (error) {
      console.error('Failed to generate template:', error);
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  // Find leads
  const handleFindLeads = async () => {
    if (!projectId || !location) return;

    setIsFindingLeads(true);
    try {
      // Use the chat to trigger lead generation
      const industry = selectedIndustry === 'other' ? customIndustry : selectedIndustry;
      const searchTerms = noWebsiteOnly ? '' : industry;

      // Call the leads API directly or trigger via chat
      window.dispatchEvent(new CustomEvent('autoSubmitPrompt', {
        detail: {
          prompt: `Use the generate_leads tool to find ${industry} businesses ${noWebsiteOnly ? 'without websites ' : ''}in "${location}". Execute now with location="${location}", numberOfLeads=${leadCount}${noWebsiteOnly ? ', noWebsiteOnly=true' : ''}.`
        }
      }));

      // Wait for leads to be generated, then fetch them
      setTimeout(async () => {
        const response = await fetch(`/api/leads?project_id=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads || []);
          // Auto-select all leads
          setSelectedLeads(new Set(data.leads?.map((l: Lead) => l.id) || []));
        }
        setIsFindingLeads(false);
        setCurrentStep('generate');
      }, 15000); // Wait for lead generation
    } catch (error) {
      console.error('Failed to find leads:', error);
      setIsFindingLeads(false);
    }
  };

  // Fetch existing leads
  const fetchExistingLeads = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/leads?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        setSelectedLeads(new Set(data.leads?.map((l: Lead) => l.id) || []));
        if (data.leads?.length > 0) {
          setCurrentStep('generate');
        }
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  // Generate sites for selected leads
  const handleGenerateSites = async () => {
    if (!projectId || !template || selectedLeads.size === 0) return;

    setIsGeneratingSites(true);
    setGenerationProgress(0);

    try {
      const response = await fetch(`/api/templates/${template.id}/generate-sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          lead_ids: Array.from(selectedLeads),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate sites');
      }

      const data = await response.json();
      setGeneratedSites(data.sites || []);
      setGenerationProgress(100);
      setCurrentStep('export');
    } catch (error) {
      console.error('Failed to generate sites:', error);
    } finally {
      setIsGeneratingSites(false);
    }
  };

  // Copy all links
  const handleCopyAllLinks = () => {
    const links = generatedSites.map(s =>
      `${s.leadName}: ${window.location.origin}${s.previewUrl}`
    ).join('\n');
    navigator.clipboard.writeText(links);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Company Name', 'Preview URL', 'Status'];
    const rows = generatedSites.map(s => [
      s.leadName,
      `${window.location.origin}${s.previewUrl}`,
      s.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template?.name || 'sites'}-preview-links.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Go back to overview
  const handleBack = () => {
    setCanvasState({ type: 'overview' });
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 'industry':
      case 'screenshot':
      case 'template':
        return renderTemplateSection();
      case 'leads':
        return renderLeadsSection();
      case 'generate':
        return renderGenerateSection();
      case 'export':
        return renderExportSection();
      default:
        return null;
    }
  };

  // Template creation section (steps 1-3)
  const renderTemplateSection = () => (
    <div className="space-y-6">
      {/* Step 1: Industry */}
      <div className={`${cardBg} ${cardBorder} border rounded-xl p-6 backdrop-blur-sm`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${selectedIndustry ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
            {selectedIndustry ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Pick Your Industry</h3>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${inputBg} ${inputBorder} border ${textPrimary}`}
          >
            <span className={selectedIndustry ? textPrimary : textSecondary}>
              {selectedIndustry
                ? INDUSTRIES.find(i => i.id === selectedIndustry)?.label
                : 'Select an industry...'}
            </span>
            <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
          </button>

          {showIndustryDropdown && (
            <div className={`absolute z-50 w-full mt-2 ${cardBg} ${cardBorder} border rounded-lg shadow-xl max-h-64 overflow-y-auto`}>
              {INDUSTRIES.map(industry => (
                <button
                  key={industry.id}
                  onClick={() => {
                    setSelectedIndustry(industry.id);
                    setShowIndustryDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-zinc-700/50 ${textPrimary} ${selectedIndustry === industry.id ? 'bg-zinc-700/30' : ''}`}
                >
                  {industry.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedIndustry === 'other' && (
          <input
            type="text"
            value={customIndustry}
            onChange={(e) => setCustomIndustry(e.target.value)}
            placeholder="Enter your industry..."
            className={`w-full mt-3 px-4 py-3 rounded-lg ${inputBg} ${inputBorder} border ${textPrimary}`}
          />
        )}

        <p className={`mt-3 text-sm ${textSecondary}`}>
          Popular: Plumbers, Dentists, Restaurants, Gyms, Salons
        </p>
      </div>

      {/* Step 2: Screenshot */}
      <div className={`${cardBg} ${cardBorder} border rounded-xl p-6 backdrop-blur-sm ${!selectedIndustry ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${screenshotFile ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
            {screenshotFile ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Upload Design Reference</h3>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
            isUploadDragging
              ? 'border-blue-500 bg-blue-500/10'
              : screenshotPreview
              ? 'border-green-500/50'
              : `${inputBorder}`
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {screenshotPreview ? (
            <div className="relative">
              <img
                src={screenshotPreview}
                alt="Screenshot preview"
                className="max-h-48 mx-auto rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setScreenshotFile(null);
                  setScreenshotPreview('');
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className={`w-12 h-12 mx-auto mb-4 ${textSecondary}`} />
              <p className={`font-medium ${textPrimary}`}>
                Drag & drop screenshot here
              </p>
              <p className={`text-sm ${textSecondary} mt-1`}>
                or click to upload
              </p>
            </div>
          )}
        </div>

        <p className={`mt-3 text-sm ${textSecondary}`}>
          AI will extract: Colors, Layout, Typography, Vibe
        </p>
      </div>

      {/* Step 3: Generate */}
      <div className={`${cardBg} ${cardBorder} border rounded-xl p-6 backdrop-blur-sm ${!screenshotFile ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${template ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
            {template ? <Check className="w-4 h-4" /> : '3'}
          </div>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Generate Base Template</h3>
        </div>

        <button
          onClick={handleGenerateTemplate}
          disabled={isGeneratingTemplate || !screenshotFile}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isGeneratingTemplate ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing & Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Template
            </>
          )}
        </button>

        {template && (
          <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'} border`}>
            <p className="text-green-500 font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              Template created: {template.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Leads section
  const renderLeadsSection = () => (
    <div className="space-y-6">
      <div className={`${cardBg} ${cardBorder} border rounded-xl p-6 backdrop-blur-sm`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
            4
          </div>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Find Leads</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Austin, TX"
              className={`w-full px-4 py-3 rounded-lg ${inputBg} ${inputBorder} border ${textPrimary}`}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Number of leads</label>
              <select
                value={leadCount}
                onChange={(e) => setLeadCount(Number(e.target.value))}
                className={`w-full px-4 py-3 rounded-lg ${inputBg} ${inputBorder} border ${textPrimary}`}
              >
                <option value={10}>10 leads</option>
                <option value={20}>20 leads</option>
                <option value={30}>30 leads</option>
                <option value={50}>50 leads</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noWebsiteOnly}
              onChange={(e) => setNoWebsiteOnly(e.target.checked)}
              className="w-5 h-5 rounded border-zinc-600 text-blue-500 focus:ring-blue-500"
            />
            <span className={textPrimary}>Only businesses without websites (highest value)</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleFindLeads}
              disabled={isFindingLeads || !location}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isFindingLeads ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding leads...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find Leads
                </>
              )}
            </button>

            <button
              onClick={fetchExistingLeads}
              className={`px-6 py-4 rounded-xl ${inputBg} ${inputBorder} border ${textPrimary} font-medium hover:opacity-80 transition-opacity`}
            >
              Use Existing
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Generate section
  const renderGenerateSection = () => (
    <div className="space-y-6">
      <div className={`${cardBg} ${cardBorder} border rounded-xl p-6 backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-500 text-white`}>
              5
            </div>
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Generate Personalized Sites</h3>
          </div>
          <button
            onClick={toggleSelectAll}
            className={`text-sm ${textSecondary} hover:text-blue-500 transition-colors`}
          >
            {selectedLeads.size === leads.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <p className={`${textSecondary} mb-4`}>
          Found {leads.length} leads - Select which ones to generate sites for
        </p>

        {/* Lead grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto mb-6">
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => toggleLeadSelection(lead.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedLeads.has(lead.id)
                  ? 'border-blue-500 bg-blue-500/10'
                  : `${inputBorder} ${inputBg}`
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                  selectedLeads.has(lead.id)
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : inputBorder
                }`}>
                  {selectedLeads.has(lead.id) && <Check className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm truncate ${textPrimary}`}>
                    {lead.companyName}
                  </p>
                  {lead.rating && (
                    <p className={`text-xs ${textSecondary}`}>
                      {'★'.repeat(Math.round(lead.rating))} {lead.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerateSites}
          disabled={isGeneratingSites || selectedLeads.size === 0}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isGeneratingSites ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating {selectedLeads.size} Sites...
            </>
          ) : (
            <>
              <Globe className="w-5 h-5" />
              Generate Sites for {selectedLeads.size} Leads
            </>
          )}
        </button>

        {isGeneratingSites && (
          <div className="mt-4">
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className={`text-sm ${textSecondary} mt-2 text-center`}>
              {generationProgress}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Export section
  const renderExportSection = () => (
    <div className="space-y-6">
      <div className={`${cardBg} ${cardBorder} border rounded-xl p-6 backdrop-blur-sm`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-500 text-white`}>
            <Check className="w-4 h-4" />
          </div>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>
            {generatedSites.length} Sites Ready!
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCopyAllLinks}
            className="flex-1 py-3 rounded-lg bg-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
          >
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedAll ? 'Copied!' : 'Copy All Links'}
          </button>
          <button
            onClick={handleExportCSV}
            className={`flex-1 py-3 rounded-lg ${inputBg} ${inputBorder} border ${textPrimary} font-medium flex items-center justify-center gap-2 hover:opacity-80 transition-opacity`}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Sites list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {generatedSites.map(site => (
            <div
              key={site.leadId}
              className={`flex items-center justify-between p-3 rounded-lg ${inputBg}`}
            >
              <div className="min-w-0 flex-1">
                <p className={`font-medium truncate ${textPrimary}`}>{site.leadName}</p>
                <p className={`text-sm truncate ${textSecondary}`}>
                  {window.location.origin}{site.previewUrl}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${site.previewUrl}`)}
                  className={`p-2 rounded hover:bg-zinc-700/50 ${textSecondary} hover:text-white transition-colors`}
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={site.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded hover:bg-zinc-700/50 ${textSecondary} hover:text-white transition-colors`}
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className={`p-2 rounded-lg ${inputBg} ${inputBorder} border hover:opacity-80 transition-opacity`}
          >
            <ArrowLeft className={`w-5 h-5 ${textSecondary}`} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Template Builder</h1>
            <p className={textSecondary}>Create templates, find leads, generate personalized sites</p>
          </div>
        </div>

        {/* Step content */}
        {renderStep()}
      </div>
    </div>
  );
}
