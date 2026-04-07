import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Search, ChevronDown, Book, CreditCard, Settings } from "lucide-react";

const HelpCenterPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Search Header */}
      <div className="bg-blue-600 py-24 text-center px-4">
         <h1 className="text-4xl font-bold text-white mb-8">How can we help you?</h1>
         <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for articles, guides, or topics..." 
              className="w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none shadow-lg focus:ring-4 focus:ring-blue-400/50"
            />
         </div>
      </div>

      <div className="flex-1 container max-w-5xl py-24">
         <h2 className="text-2xl font-bold mb-8 text-center">Browse by Category</h2>
         
         <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="border border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
               <Book className="text-blue-500 mb-4" size={32} />
               <h3 className="font-bold text-lg mb-2">Getting Started</h3>
               <p className="text-gray-500 text-sm">Learn the basics of setting up your workspace and inviting your team.</p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
               <Settings className="text-blue-500 mb-4" size={32} />
               <h3 className="font-bold text-lg mb-2">Projects & Tasks</h3>
               <p className="text-gray-500 text-sm">Master views, workflows, automations, and advanced project management.</p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
               <CreditCard className="text-blue-500 mb-4" size={32} />
               <h3 className="font-bold text-lg mb-2">Billing</h3>
               <p className="text-gray-500 text-sm">Manage your subscription, invoices, and payment methods securely.</p>
            </div>
         </div>

         <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
               {[
                 "How do I reset my password?",
                 "What is the difference between Pro and Business plans?",
                 "How can I integrate FlowForge with Slack?",
                 "Can I export my data?"
               ].map((faq, i) => (
                 <div key={i} className="border border-gray-200 rounded-xl p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                    <span className="font-medium text-gray-800">{faq}</span>
                    <ChevronDown className="text-gray-400" />
                 </div>
               ))}
            </div>
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenterPage;
