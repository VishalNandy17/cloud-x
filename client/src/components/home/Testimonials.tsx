'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Priya Raghavan',
    role: 'CTO',
    company: 'NovaSpark Technologies',
    quote:
      'D-CloudX cut our GPU rental costs by 40% overnight. The smart-contract escrow means we never chase providers for refunds — disputes resolve themselves on-chain within minutes.',
    rating: 5,
    avatar: 'PR',
  },
  {
    name: 'Marcus Webb',
    role: 'Lead DevOps Engineer',
    company: 'Stratos AI Labs',
    quote:
      'The AI matching engine is genuinely impressive. It routed our ML training jobs to the cheapest available nodes without us lifting a finger. We shipped our model two weeks early.',
    rating: 5,
    avatar: 'MW',
  },
  {
    name: 'Leila Ahmadi',
    role: 'Founder & CEO',
    company: 'Cloudwave Ventures',
    quote:
      'Listing our idle servers on D-CloudX turned them into a meaningful passive revenue stream. The DCX token rewards stack on top — this is the future of infrastructure monetisation.',
    rating: 5,
    avatar: 'LA',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const AVATAR_COLORS = [
  { bg: 'rgba(124,92,252,0.2)', border: 'rgba(124,92,252,0.4)', text: '#a78bfa' },
  { bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.4)', text: '#60a5fa' },
  { bg: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.4)', text: '#f472b6' },
];

export default function Testimonials() {
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
            Testimonials
          </span>
          <h2 className="font-garamond text-4xl sm:text-5xl font-semibold gradient-text">
            Trusted by builders worldwide
          </h2>
          <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Hear from the teams and individuals who power their infrastructure on D-CloudX every day.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {testimonials.map((t, idx) => {
            const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <motion.div
                key={t.name}
                variants={cardVariants}
                className="glass-card feature-card rounded-2xl p-6 flex flex-col gap-5 group relative overflow-hidden"
              >
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                      strokeWidth={0}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{
                      background: avatarStyle.bg,
                      border: `1px solid ${avatarStyle.border}`,
                      color: avatarStyle.text,
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 100%, rgba(124,92,252,0.07) 0%, transparent 70%)',
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
