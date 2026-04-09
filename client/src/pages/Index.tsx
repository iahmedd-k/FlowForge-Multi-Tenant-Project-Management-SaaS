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
import { useEffect } from "react";

const Index = () => {
  usePageMeta("FlowForge | Tasks, Projects, Reporting, and Automations", "FlowForge helps teams manage tasks, track projects, invite members, review reporting, and run practical automations in one workspace.");

  // ====================================================================
  // COLD START WAKE-UP CALL
  // ====================================================================
  // This useEffect calls the backend health check endpoint on page load
  // to wake up the server on Render's free tier (which goes inactive
  // after 15 minutes of no activity). By the time the user navigates
  // to login/signup, the server will already be active.
  //
  // To remove this functionality:
  // 1. Delete this entire useEffect block (lines below)
  // 2. Delete the health check route in server/server.js
  // ====================================================================
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await fetch(`${apiUrl}/health`, { method: 'GET' });
      } catch (err) {
        // Silent fail - this is just a background wake-up call
        console.debug('Health check call silently failed (expected on localhost)');
      }
    };

    wakeUpServer();
  }, []); // Empty deps - runs only once on page load
  // END OF COLD START WAKE-UP
  // ====================================================================

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
