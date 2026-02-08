import React from 'react';
import Features from '../components/Features';
import Hero from '../components/Hero';
import Testimonials from '../components/Testimonials';
import CTASection from '../components/CTASection';
import AboutCard from '../components/AboutCard';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <AboutCard />
      <Testimonials />
      <CTASection />
    </div>
  );
};

export default Home;