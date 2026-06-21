'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ListResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    resourceType: string;
    cpu: number;
    ram: number;
    storage: number;
    pricePerHour: string;
  }) => Promise<void>;
}

const RESOURCE_TYPES = ['compute', 'storage', 'gpu', 'network'] as const;

const defaultForm = {
  resourceType: 'compute',
  cpu: 2,
  ram: 4,
  storage: 50,
  pricePerHour: '0.001',
};

export default function ListResourceModal({ isOpen, onClose, onSubmit }: ListResourceModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm);
      setError(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.cpu < 1 || form.ram < 1 || form.storage < 1) {
      setError('CPU, RAM and Storage must be at least 1.');
      return;
    }
    if (!form.pricePerHour || isNaN(parseFloat(form.pricePerHour)) || parseFloat(form.pricePerHour) <= 0) {
      setError('Enter a valid price per hour.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        resourceType: form.resourceType,
        cpu: Number(form.cpu),
        ram: Number(form.ram),
        storage: Number(form.storage),
        pricePerHour: form.pricePerHour,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to list resource. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="modal"
            className="overlay-panel fixed z-50 w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  List a Resource
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Publish your cloud resource to the marketplace
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                aria-label="Close modal"
              >
                <X size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Resource Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Resource Type
                </label>
                <select
                  value={form.resourceType}
                  onChange={(e) => setForm({ ...form, resourceType: e.target.value })}
                  className="glass-input rounded-lg px-3 py-2.5 text-sm capitalize"
                  style={{
                    background: 'hsla(252,10%,12%,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                  }}
                  required
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t} style={{ background: '#12121a' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* CPU / RAM / Storage row */}
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { key: 'cpu', label: 'vCPU', min: 1, max: 256 },
                    { key: 'ram', label: 'RAM (GB)', min: 1, max: 2048 },
                    { key: 'storage', label: 'Storage (GB)', min: 1, max: 65536 },
                  ] as const
                ).map(({ key, label, min, max }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: Math.max(min, Number(e.target.value)) })
                      }
                      className="glass-input rounded-lg px-3 py-2.5 text-sm w-full"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Price per hour */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Price per Hour (ETH)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.001"
                    value={form.pricePerHour}
                    onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2.5 text-sm w-full pr-12"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                    style={{ color: 'var(--accent-purple)' }}
                  >
                    ETH
                  </span>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="text-xs px-3 py-2.5 rounded-lg"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fca5a5',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 text-sm font-medium py-2.5 rounded-lg transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: 'var(--text-secondary)',
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 purple-gradient-btn text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Listing…
                    </span>
                  ) : (
                    'List Resource'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
