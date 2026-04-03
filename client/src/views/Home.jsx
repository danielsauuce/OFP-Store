import Hero from '../components/Hero';
import Features from '../components/Features';
import CollectionGrid from '../components/CollectionGrid';
import OfferSection from '../components/OfferSection';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import CTASection from '../components/CTASection';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <CollectionGrid />
      <OfferSection />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default Home;
