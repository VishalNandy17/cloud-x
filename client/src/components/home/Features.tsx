'use client';

import { motion } from 'framer-motion';
import {
  Server,
  Shield,
  Sparkles,
  Activity,
  CheckCircle,
  Coins,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  Icon: LucideIcon;
  title: string;
  description: string;
  accentColor: string;
}

const features: Feature[] = [
  {
    Icon: Server,
    title: 'Decentralized Marketplace',
    description:
      'Access a global network of cloud resources from independent providers without central gatekeepers or hidden fees.',
    accentColor: 'text-violet-400',
  },
  {
    Icon: Shield,
    title: 'Blockchain Escrow',
    description:
      'Every transaction is secured by audited smart contracts that release funds only when SLA conditions are verified.',
    accentColor: 'text-blue-400',
  },
  {
    Icon: Sparkles,
    title: 'AI-Powered Matching',
    description:
      'Our ML engine pairs your workload specs with the optimal provider in milliseconds, maximising performance and cost efficiency.',
    accentColor: 'text-purple-400',
  },
  {
    Icon: Activity,
    title: 'Real-time Monitoring',
    description:
      'Live dashboards stream latency, throughput, and availability metrics so you always know exactly what you are paying for.',
    accentColor: 'text-emerald-400',
  },
  {
    Icon: CheckCircle,
    title: 'SLA Enforcement',
    description:
      'Automated on-chain SLA checks trigger instant credits or refunds without the need to raise a support ticket.',
    accentColor: 'text-teal-400',
  },
  {
    Icon: Coins,
    title: 'DCX Token Economy',
    description:
      'Stake, earn, and spend DCX tokens to unlock premium resources, governance rights, and protocol revenue sharing.',
    accentColor: 'text-amber-400',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Features() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <span className="badge uppercase tracking-widest text-xs mb-4 inline-block">
            Why D-CloudX
          </span>
          <h2
            className="font-garamond text-4xl sm:text-5xl font-semibold gradient-text leading-tight"
          >
            Everything you need to trade cloud
            <br className="hidden sm:block" /> resources at Web3 speed
          </h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => {
            const { Icon, title, description, accentColor } = feature;
            return (
              <motion.div
                key={title}
                variants={cardVariants}
                className="glass-card feature-card rounded-2xl p-6 flex flex-col gap-4 group relative overflow-hidden cursor-default"
              >
                {/* Icon badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)' }}
                >
                  <Icon className={`w-5 h-5 ${accentColor}`} strokeWidth={1.75} />
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {description}
                  </p>
                </div>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 0% 0%, rgba(124,92,252,0.07) 0%, transparent 60%)',
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
