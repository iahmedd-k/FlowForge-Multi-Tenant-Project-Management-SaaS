import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Link, useParams } from "react-router-dom";
import { Check, X } from "lucide-react";

const ComparePage = () => {
  const { competitor } = useParams();
  const cName = competitor?.charAt(0).toUpperCase() + competitor?.slice(1) || "Competitor";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-5xl py-24">
         <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">Comparison</div>
            <h1 className="text-5xl font-display font-medium text-gray-900 mb-6">FlowForge vs {cName}</h1>
            <p className="text-xl text-gray-500 font-medium">Why growing teams are switching from {cName} to FlowForge for better scale, AI workflows, and simplicity.</p>
         </div>

         <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-16">
            <table className="w-full text-left font-medium">
              <thead>
                 <tr className="border-b border-gray-200 bg-gray-50/50 text-lg">
                    <th className="py-6 px-8 font-bold text-gray-900 w-1/3">Features</th>
                    <th className="py-6 px-8 font-bold text-blue-600 w-1/3 bg-blue-50/30 border-l border-r border-blue-100">FlowForge</th>
                    <th className="py-6 px-8 font-bold text-gray-500 w-1/3">{cName}</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {[
                   { f: "Purpose-built AI Agents", us: true, them: false },
                   { f: "Flat Pricing Model", us: true, them: false },
                   { f: "Custom Workflow Automations", us: true, them: true },
                   { f: "Native Kanban & Gantt", us: true, them: true },
                   { f: "Generative AI Document Editor", us: true, them: false },
                 ].map((row, i) => (
                   <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-5 px-8 text-gray-700 font-bold">{row.f}</td>
                      <td className="py-5 px-8 text-center bg-blue-50/10 border-l border-r border-blue-50">
                         {row.us ? <Check size={20} className="mx-auto text-blue-500" /> : <X size={20} className="mx-auto text-gray-300" />}
                      </td>
                      <td className="py-5 px-8 text-center text-gray-500">
                         {row.them ? <Check size={20} className="mx-auto" /> : <X size={20} className="mx-auto text-gray-300" />}
                      </td>
                   </tr>
                 ))}
              </tbody>
            </table>
         </div>

         <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Ready to make the switch?</h2>
            <Link to="/signup" className="inline-block bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors">
               Start migrating today
            </Link>
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default ComparePage;
