import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import MvpFeatureCards from '../components/landing/MvpFeatureCards';
import Features from '../components/landing/Features';
import Showcase from '../components/landing/Showcase';
import Pricing from '../components/landing/Pricing';
import Testimonials from '../components/landing/Testimonials';
import SocialProof from '../components/landing/SocialProof';
import CtaSection from '../components/landing/CtaSection';
import Footer from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <MvpFeatureCards />
      <Features />
      <Showcase />
      <SocialProof />
      <Pricing />
      <Testimonials />
      <CtaSection />
      <Footer />
    </div>
  );
}
