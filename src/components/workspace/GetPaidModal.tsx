'use client';

import { useState } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  Send,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import type { Lead } from '@/types/database';

interface GetPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess?: (paymentLinkUrl: string) => void;
  projectId: string;
}

export default function GetPaidModal({
  isOpen,
  onClose,
  lead,
  onSuccess,
  projectId,
}: GetPaidModalProps) {
  const [amount, setAmount] = useState(lead.dealValue?.toString() || '');
  const [description, setDescription] = useState(`Website Design for ${lead.companyName}`);
  const [currency, setCurrency] = useState('USD');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<{
    url: string;
    id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          projectId,
          amount: parseFloat(amount),
          currency: currency.toLowerCase(),
          description,
          leadName: lead.companyName,
          leadEmail: lead.contactEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      setPaymentLink({
        url: data.paymentLink.url,
        id: data.paymentLink.id,
      });

      onSuccess?.(data.paymentLink.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (paymentLink) {
      await navigator.clipboard.writeText(paymentLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CreditCard className="text-green-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Get Paid!</h2>
              <p className="text-sm text-zinc-400">{lead.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentLink ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Payment Link Created!</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Share this link with {lead.companyName} to collect payment.
              </p>

              {/* Payment Link Display */}
              <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 justify-between">
                  <code className="text-sm text-blue-400 truncate flex-1">
                    {paymentLink.url}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-zinc-700 transition-colors shrink-0"
                  >
                    {copied ? (
                      <CheckCircle size={18} className="text-green-400" />
                    ) : (
                      <Copy size={18} className="text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                >
                  <Copy size={18} />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={paymentLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                >
                  <ExternalLink size={18} />
                  Open Link
                </a>
              </div>

              {/* Email Option */}
              {lead.contactEmail && (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <a
                    href={`mailto:${lead.contactEmail}?subject=Payment for ${description}&body=Hi,%0A%0APlease use the following link to complete your payment:%0A%0A${encodeURIComponent(paymentLink.url)}%0A%0AThank you!`}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-xl transition-colors"
                  >
                    <Send size={18} />
                    Send via Email
                  </a>
                </div>
              )}
            </div>
          ) : (
            // Form State
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <DollarSign size={18} />
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-20 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 text-lg font-medium"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-700 border-none text-white text-sm rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this payment for?"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Quick amounts
                </label>
                <div className="flex gap-2">
                  {[500, 1000, 2500, 5000].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        amount === quickAmount.toString()
                          ? 'bg-green-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      ${quickAmount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateLink}
                disabled={isCreating || !amount}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating Payment Link...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Create Payment Link
                  </>
                )}
              </button>

              {/* Info */}
              <p className="mt-4 text-xs text-zinc-500 text-center">
                Powered by Stripe. The customer will be redirected to a secure payment page.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
