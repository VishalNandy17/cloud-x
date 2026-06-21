import { Suspense } from 'react';
import { Metadata } from 'next';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import Stats from '../components/home/Stats';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import CTA from '../components/home/CTA';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export const metadata: Metadata = {
  title: 'D-CloudX | Decentralized Cloud Resource Marketplace',
  description: 'Revolutionizing cloud computing through blockchain technology. Rent and monetize cloud resources in a trustless, decentralized marketplace.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </Suspense>
    </main>
  );
}
