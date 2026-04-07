import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { LifeBuoy, Handshake } from "lucide-react";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/60 via-purple-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="flex-1 container max-w-6xl py-24 relative z-10">
         <motion.h1 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-5xl md:text-6xl font-display font-medium text-gray-900 mb-16 text-center lg:text-left"
         >
            We're here to help.
         </motion.h1>

         <div className="flex flex-col lg:flex-row gap-16">
            {/* Left side form */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="lg:w-3/5"
            >
               <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Work email *</label>
                    <input 
                      type="email" 
                      placeholder="name@company.com" 
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">First name *</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Last name *</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Question about *</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 appearance-none"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>Select an option</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing & Account</option>
                      <option value="partnership">Partnerships</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">How can we help you? *</label>
                    <textarea 
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      required
                    ></textarea>
                  </div>

                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="consent" className="mt-1 flex-shrink-0" required />
                    <label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed">
                      I agree to receive communications from FlowForge about products, services, and events. I can unsubscribe at any time.
                    </label>
                  </div>

                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold transition-colors">
                    Submit
                  </button>
               </form>
            </motion.div>

            {/* Right side support options */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
               className="lg:w-2/5 space-y-6"
            >
               <a href="/help" className="block bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <LifeBuoy size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Get support</h3>
                  <p className="text-gray-600 font-medium">Find out how to set up your account, manage projects, and troubleshoot issues.</p>
               </a>

               <a href="/partners" className="block bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Handshake size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Partner with us</h3>
                  <p className="text-gray-600 font-medium">Join our partner program to grow your business and help clients succeed with FlowForge.</p>
               </a>
            </motion.div>
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
