'use client';

import { motion } from 'framer-motion';
import { Wallet, Search, CreditCard, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  step: number;
  Icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    step: 1,
    Icon: Wallet,
    title: 'Connect Wallet',
    description: 'Connect MetaMask or any Web3 wallet to access the decentralised marketplace.',
  },
  {
    step: 2,
    Icon: Search,
    title: 'Browse Resources',
    description: 'Find cloud resources that match your compute, storage, and networking needs.',
  },
  {
    step: 3,
    Icon: CreditCard,
    title: 'Book & Pay',
    description: 'Secure your booking with instant payment via audited smart-contract escrow.',
  },
  {
    step: 4,
    Icon: BarChart3,
    title: 'Monitor & Scale',
    description: 'Track usage metrics in real time and scale resources up or down on demand.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const lineVariants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.6, ease: 'easeInOut', delay: 0.25 },
  },
};

export default function HowItWorks() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background glow */}
      <div
        className="glow-orb w-[500px] h-[300px] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-[0.06]"
        style={{ background: '#7c5cfc' }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="text-center mb-20"
        >
          <span className="badge uppercase tracking-widest text-xs mb-4 inline-block">
            Get Started
          </span>
          <h2 className="font-garamond text-4xl sm:text-5xl font-semibold gradient-text">
            How It Works
          </h2>
          <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            From wallet connection to live resource monitoring — four simple steps to get you trading on the network.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative"
        >
          {steps.map((step, index) => {
            const { Icon, title, description } = step;
            const isLast = index === steps.length - 1;

            return (
              <motion.div
                key={title}
                variants={stepVariants}
                className="relative flex flex-col items-center text-center"
              >
                {/* Connecting line (desktop) */}
                {!isLast && (
                  <motion.div
                    variants={lineVariants}
                    className="hidden lg:block absolute top-[28px] left-1/2 w-full h-px"
                    style={{
                      background: 'linear-gradient(90deg, rgba(124,92,252,0.5) 0%, rgba(124,92,252,0.1) 100%)',
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Number circle */}
                <div className="relative z-10 mb-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #7c5cfc 0%, #5a3fd4 100%)',
                      boxShadow: '0 0 0 4px rgba(124,92,252,0.15), 0 4px 20px rgba(124,92,252,0.3)',
                    }}
                  >
                    <span className="font-garamond text-xl font-semibold text-white">
                      {step.step}
                    </span>
                  </div>
                </div>

                {/* Icon */}
                <div
                  className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(124,92,252,0.1)',
                    border: '1px solid rgba(124,92,252,0.2)',
                  }}
                >
                  <Icon className="w-5 h-5 text-violet-400" strokeWidth={1.75} />
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed px-1" style={{ color: 'var(--text-secondary)' }}>
                  {description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
