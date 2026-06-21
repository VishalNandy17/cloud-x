'use client';

import { motion } from 'framer-motion';

interface Stat {
  value: string;
  label: string;
  gradient: string;
}

const stats: Stat[] = [
  {
    value: '500+',
    label: 'Resources Listed',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    value: '$2.4M+',
    label: 'Volume Traded',
    gradient: 'from-blue-400 to-violet-500',
  },
  {
    value: '10,000+',
    label: 'Active Users',
    gradient: 'from-purple-400 to-pink-400',
  },
  {
    value: '99.9%',
    label: 'Uptime',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Stats() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 right-0 h-px divider-glow" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="badge uppercase tracking-widest text-xs">
            Platform Metrics
          </span>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              className="glass-card stat-card rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center group cursor-default feature-card"
            >
              {/* Glowing number */}
              <span
                className={`font-garamond text-4xl sm:text-5xl font-semibold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent mb-2 drop-shadow-lg`}
              >
                {stat.value}
              </span>

              {/* Label */}
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {stat.label}
              </span>

              {/* Hover glow accent */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 0%, rgba(124,92,252,0.08) 0%, transparent 70%)',
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px divider-glow" />
    </section>
  );
}
