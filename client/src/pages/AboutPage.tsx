import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="container max-w-4xl py-24 text-center">
           <h1 className="text-5xl font-display font-medium text-gray-900 mb-8">Empowering teams to do their best work</h1>
           <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
             FlowForge was founded on the belief that work should be intuitive, connected, and augmented by AI. We're on a mission to completely reimagine the traditional software platform.
           </p>
        </div>
        
        <div className="bg-gray-50 py-24">
           <div className="container max-w-6xl">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                 <div className="bg-white aspect-square rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex items-center justify-center p-8">
                   <div className="text-center opacity-30">
                     <div className="text-6xl mb-4">👥</div>
                     <div className="font-bold">Team Photo Placeholder</div>
                   </div>
                 </div>
                 <div>
                    <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      We believe the next decade of software relies on highly adaptive systems that understand intent, not just commands. FlowForge acts as a connective tissue across an organization.
                    </p>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Our small, globally distributed team of engineers, designers, and thinkers is working tirelessly to craft the best possible experience for our users. We value simplicity over complexity, and speed over bureaucracy.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
