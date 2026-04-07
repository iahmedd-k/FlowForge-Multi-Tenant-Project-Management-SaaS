import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import MvpFeatureCards from "@/components/landing/MvpFeatureCards";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import usePageMeta from "@/hooks/usePageMeta";
import AICapabilities from "@/components/landing/AICapabilities";

const Index = () => {
  usePageMeta("FlowForge | Tasks, Projects, Reporting, and Automations", "FlowForge helps teams manage tasks, track projects, invite members, review reporting, and run practical automations in one workspace.");

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
   

      <Features />
      <AICapabilities />
      <MvpFeatureCards />

      <Testimonials />
      <Pricing />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
