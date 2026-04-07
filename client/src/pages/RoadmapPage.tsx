import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Target, TrendingUp, CheckCircle } from "lucide-react";

const RoadmapPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-5xl py-24">
        <h1 className="text-5xl font-display font-medium text-gray-900 mb-6 text-center">Product Roadmap</h1>
        <p className="text-xl text-gray-500 font-medium text-center mb-16 max-w-2xl mx-auto">See what we're building next and the features we've recently released to make your workflow better.</p>
        
        <div className="grid md:grid-cols-3 gap-8">
           <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
             <div className="flex items-center gap-2 mb-6">
                <Target className="text-blue-500" size={24} />
                <h3 className="font-bold text-xl text-gray-900">Planned</h3>
             </div>
             <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-sm mb-1">Advanced AI Agents</h4>
                    <p className="text-xs text-gray-500">Custom training for conversational agents using your own docs.</p>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100">
             <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-purple-500" size={24} />
                <h3 className="font-bold text-xl text-gray-900">In Progress</h3>
             </div>
             <div className="space-y-4">
                {[1,2].map(i => (
                  <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-sm mb-1">Dark Mode Mobile</h4>
                    <p className="text-xs text-gray-500">Bringing the highly requested dark mode to iOS and Android apps.</p>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100">
             <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="text-green-500" size={24} />
                <h3 className="font-bold text-xl text-gray-900">Released</h3>
             </div>
             <div className="space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-sm mb-1">Gantt View 2.0</h4>
                    <p className="text-xs text-gray-500">Completely rebuilt for speed with infinite scrolling and zoom.</p>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RoadmapPage;
