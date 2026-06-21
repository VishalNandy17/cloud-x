'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      {/* ── Background orbs ── */}
      <div
        className="glow-orb w-[700px] h-[400px] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-[0.18]"
        style={{ background: 'radial-gradient(ellipse, #7c5cfc 0%, #5a3fd4 50%, transparent 70%)' }}
      />
      <div
        className="glow-orb w-[300px] h-[200px] left-[15%] top-[20%] opacity-[0.10]"
        style={{ background: '#5a3fd4' }}
      />
      <div
        className="glow-orb w-[250px] h-[180px] right-[12%] bottom-[20%] opacity-[0.08]"
        style={{ background: '#7c5cfc' }}
      />

      {/* ── Top divider ── */}
      <div className="absolute top-0 left-0 right-0 h-px divider-glow opacity-60" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="inline-block mb-6"
        >
          <span className="badge uppercase tracking-widest text-xs">
            Join the Network
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-garamond text-5xl sm:text-6xl lg:text-7xl font-semibold leading-tight mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Start Building on{' '}
          <span className="gradient-text-purple">Web3 Cloud</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Connect your wallet and access a global, trustless marketplace for cloud resources — powered by blockchain and secured by smart contracts.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary */}
          <button
            className="purple-gradient-btn flex items-center gap-2 px-7 py-3.5 rounded-xl text-white text-sm font-semibold"
          >
            Launch App
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary */}
          <button
            className="dark-pill-btn flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            <BookOpen className="w-4 h-4 opacity-70" />
            View Docs
          </button>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          No sign-up required &middot; Non-custodial &middot; Open-source smart contracts
        </motion.p>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px divider-glow opacity-60" />
    </section>
  );
}
