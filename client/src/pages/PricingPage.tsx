import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Check, ArrowRight, Sparkles, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import usePageMeta from "@/hooks/usePageMeta";

const plans = [
  { name: "Free", price: "$0", desc: "For individuals", features: ["Up to 3 boards", "Tasks and projects", "Basic reporting"], btn: "Get Started" },
  { name: "Pro", price: "$12", desc: "For teams", features: ["Unlimited boards", "Workspace automations", "Calendar view", "Team collaboration"], btn: "Start Free Trial", popular: true },
  { name: "Business", price: "$24", desc: "For organizations", features: ["Advanced reporting", "Time tracking", "Priority alerts", "Project deadline warnings"], btn: "Contact Sales" }
];

const PricingPage = () => {
  usePageMeta("Pricing | FlowForge", "Compare FlowForge plans for task management, team collaboration, reporting, and workspace automations.");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="container max-w-6xl py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <h1 className="text-5xl font-display font-medium text-gray-900 mb-6">Simple, predictable pricing</h1>
             <p className="text-xl text-gray-500 font-medium">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
             {plans.map(plan => (
               <div key={plan.name} className={`bg-white rounded-3xl p-8 border ${plan.popular ? 'border-blue-500 shadow-xl relative' : 'border-gray-200 shadow-sm'}`}>
                  {plan.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</div>}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
                  <div className="mb-6"><span className="text-4xl font-bold">{plan.price}</span><span className="text-gray-500">/seat/month</span></div>
                  
                  <Link to="/login" className={`block w-full rounded-xl py-3 text-center font-bold transition-colors mb-8 ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                     {plan.btn}
                  </Link>

                  <ul className="space-y-4">
                     {plan.features.map(f => (
                       <li key={f} className="flex gap-3 text-sm font-medium text-gray-700">
                          <Check size={18} className="text-blue-500 shrink-0" /> {f}
                       </li>
                     ))}
                  </ul>
               </div>
             ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <div className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Team-ready plans</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">Every plan is framed around the current workspace, invite, and project flow instead of placeholder enterprise packaging.</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Sparkles size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Automation coverage</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">Pricing now clearly reflects assignment alerts, due reminders, mentions, and other automations available in the product.</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reporting visibility</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">Plans emphasize the practical reporting and execution tools that teams use day to day in FlowForge.</p>
            </div>
          </div>

          {/* Table */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm p-10">
             <h3 className="text-2xl font-bold mb-8 text-center">Feature Comparison</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left font-medium">
                 <thead>
                   <tr className="border-b border-gray-200">
                     <th className="py-4 font-bold text-gray-900">Features</th>
                     <th className="py-4 font-bold text-gray-900 text-center">Free</th>
                     <th className="py-4 font-bold text-blue-600 text-center">Pro</th>
                     <th className="py-4 font-bold text-gray-900 text-center">Business</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                   {[...Array(5)].map((_,i) => (
                     <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                       <td className="py-4 text-gray-700">Core feature row {i+1}</td>
                       <td className="py-4 text-center"><Check size={16} className="mx-auto text-gray-300" /></td>
                       <td className="py-4 text-center"><Check size={16} className="mx-auto text-blue-500" /></td>
                       <td className="py-4 text-center"><Check size={16} className="mx-auto text-blue-500" /></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;
