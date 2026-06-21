'use client';

import { useState } from 'react';
import { Cpu, Database, HardDrive, Star, Zap } from 'lucide-react';

interface Resource {
  id: number;
  provider: string;
  resourceType: string;
  cpu: number;
  ram: number;
  storage: number;
  pricePerHour: string;
  isActive: boolean;
  reputation: number;
}

interface ResourceCardProps {
  resource: Resource;
  isOwner: boolean;
  onBook: () => Promise<void>;
}

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ReputationStars({ score }: { score: number }) {
  const maxStars = 5;
  const filledStars = Math.round((score / 100) * maxStars);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={
            i < filledStars
              ? 'fill-[#7c5cfc] text-[#7c5cfc]'
              : 'fill-transparent text-[rgba(255,255,255,0.2)]'
          }
        />
      ))}
      <span className="text-xs text-[var(--text-muted)] ml-1">{score}</span>
    </div>
  );
}

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  compute: 'rgba(124,92,252,0.18)',
  storage: 'rgba(59,130,246,0.18)',
  gpu: 'rgba(234,179,8,0.18)',
  network: 'rgba(16,185,129,0.18)',
};

const RESOURCE_TYPE_TEXT: Record<string, string> = {
  compute: '#a78bfa',
  storage: '#93c5fd',
  gpu: '#fde047',
  network: '#6ee7b7',
};

export default function ResourceCard({ resource, isOwner, onBook }: ResourceCardProps) {
  const [isBooking, setIsBooking] = useState(false);

  const bgColor = RESOURCE_TYPE_COLORS[resource.resourceType] ?? 'rgba(255,255,255,0.08)';
  const textColor = RESOURCE_TYPE_TEXT[resource.resourceType] ?? 'var(--text-secondary)';

  const handleBook = async () => {
    setIsBooking(true);
    try {
      await onBook();
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="resource-card p-5 flex flex-col gap-4">
      {/* Header row: type badge + active dot */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full capitalize tracking-wide"
          style={{ background: bgColor, color: textColor, border: `1px solid ${textColor}30` }}
        >
          {resource.resourceType}
        </span>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${resource.isActive ? 'bg-emerald-400' : 'bg-[var(--text-muted)]'}`}
            style={resource.isActive ? { boxShadow: '0 0 6px rgba(52,211,153,0.6)' } : {}}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {resource.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* CPU */}
        <div
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Cpu size={16} className="text-[var(--accent-purple)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{resource.cpu}</span>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">vCPU</span>
        </div>

        {/* RAM */}
        <div
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Database size={16} className="text-[var(--accent-purple)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{resource.ram}</span>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">GB RAM</span>
        </div>

        {/* Storage */}
        <div
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <HardDrive size={16} className="text-[var(--accent-purple)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{resource.storage}</span>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">GB SSD</span>
        </div>
      </div>

      {/* Provider address */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">Provider</span>
        <span
          className="font-mono text-[var(--text-secondary)] px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          title={resource.provider}
        >
          {truncateAddress(resource.provider)}
        </span>
      </div>

      {/* Reputation */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">Reputation</span>
        <ReputationStars score={resource.reputation} />
      </div>

      {/* Divider */}
      <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.07)' }} />

      {/* Price + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-[var(--accent-purple)]" />
          <span className="text-base font-bold text-[var(--text-primary)]">
            {parseFloat(resource.pricePerHour).toFixed(4)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">ETH/hr</span>
        </div>

        {isOwner ? (
          <span
            className="text-xs font-medium px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Your Resource
          </span>
        ) : (
          <button
            className="purple-gradient-btn text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleBook}
            disabled={isBooking || !resource.isActive}
          >
            {isBooking ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Booking…
              </span>
            ) : (
              'Book Now'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
