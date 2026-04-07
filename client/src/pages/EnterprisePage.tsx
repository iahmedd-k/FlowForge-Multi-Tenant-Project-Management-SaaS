import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import EnterpriseTrust from "@/components/landing/EnterpriseTrust";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, Layers, Bot, ArrowRight, Activity, Cloud } from "lucide-react";

const EnterprisePage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-[#0A0A1F] text-white">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]" />
        </div>
        
        <div className="container relative z-10 max-w-5xl mx-auto text-center">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
           >
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold uppercase tracking-widest mb-8">
               FlowForge for Enterprise
             </div>
             <h1 className="text-5xl md:text-7xl font-display font-medium mb-8 leading-tight tracking-tight">
               Scale your operations with <br/> confidence and AI
             </h1>
             <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
               The work operating system built for large-scale organizations. Enterprise-grade security, advanced administration, and AI that works across your entire ecosystem.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <Link to="/contact" className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
                 Contact Sales <ArrowRight size={18} />
               </Link>
               <Link to="/pricing" className="bg-white/10 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-colors border border-white/20">
                 View Enterprise Pricing
               </Link>
             </div>
           </motion.div>
        </div>
      </section>

      {/* Trust section imported from landing */}
      <EnterpriseTrust />

      {/* Features with Scroll Animations */}
      <section className="py-24 bg-gray-50 overflow-hidden">
         <div className="container max-w-6xl">
            <div className="text-center mb-24">
               <h2 className="text-4xl md:text-5xl font-display font-medium text-gray-900 mb-6">Designed for global scale</h2>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to deploy FlowForge across entire departments, subsidiaries, and global offices.</p>
            </div>

            <div className="space-y-32">
               {/* Feature 1 */}
               <motion.div 
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.7 }}
                 className="flex flex-col md:flex-row items-center gap-16"
               >
                 <div className="md:w-1/2 space-y-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                       <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">Advanced Security & Governance</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Protect your most sensitive data with enterprise-grade security features including SSO, SCIM provisioning, audit logs, and HIPAA/SOC2 compliance. Define custom roles and granular permissions across workspaces.
                    </p>
                 </div>
                 <div className="md:w-1/2 w-full">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                             <div className="flex items-center gap-3"><Cloud className="text-gray-400" /> <span className="font-medium">Single Sign-On (SSO)</span></div>
                             <div className="w-10 h-6 bg-green-500 rounded-full flex justify-end p-1"><div className="w-4 h-4 bg-white rounded-full" /></div>
                          </div>
                          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                             <div className="flex items-center gap-3"><ShieldCheck className="text-gray-400" /> <span className="font-medium">SCIM Provisioning</span></div>
                             <div className="w-10 h-6 bg-green-500 rounded-full flex justify-end p-1"><div className="w-4 h-4 bg-white rounded-full" /></div>
                          </div>
                          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                             <div className="flex items-center gap-3"><Activity className="text-gray-400" /> <span className="font-medium">Audit Logs</span></div>
                             <div className="w-10 h-6 bg-green-500 rounded-full flex justify-end p-1"><div className="w-4 h-4 bg-white rounded-full" /></div>
                          </div>
                       </div>
                    </div>
                 </div>
               </motion.div>

               {/* Feature 2 */}
               <motion.div 
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.7 }}
                 className="flex flex-col md:flex-row-reverse items-center gap-16"
               >
                 <div className="md:w-1/2 space-y-6">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                       <Layers size={32} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">Cross-department workflows</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Break down silos. FlowForge Enterprise allows you to connect data across different team workspaces seamlessly. Build executive roll-up dashboards that automatically sync with granular team tasks.
                    </p>
                 </div>
                 <div className="md:w-1/2 w-full">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 aspect-square max-h-[350px] relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-100 to-transparent opacity-50" />
                      <div className="w-full max-w-sm space-y-3 p-6">
                        <div className="h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4 gap-3 transform -translate-x-4">
                           <div className="w-4 h-4 rounded-full bg-blue-400" /> <div className="h-2 w-24 bg-gray-200 rounded" />
                        </div>
                        <div className="h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4 gap-3 z-10 relative">
                           <div className="w-4 h-4 rounded-full bg-purple-400" /> <div className="h-2 w-32 bg-gray-200 rounded" />
                        </div>
                        <div className="h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4 gap-3 transform translate-x-4">
                           <div className="w-4 h-4 rounded-full bg-green-400" /> <div className="h-2 w-20 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                 </div>
               </motion.div>

            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
};

export default EnterprisePage;
