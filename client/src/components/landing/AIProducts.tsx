import { ArrowRight, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const products = [
  {
    logo: "FlowForge",
    logoAccent: "dev",
    title: "Build faster, release better",
    description: "Plan roadmaps, manage sprints, and release products without scaling complexity.",
    color: "bg-[#c5fab4]",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600&h=400",
    mockupInfo: "Code Reviewer"
  },
  {
    logo: "FlowForge",
    logoAccent: "work management",
    title: "AI-driven planning, execution & delivery",
    description: "Drive projects and processes forward at scale, with AI that executes, builds, and automates for you",
    color: "bg-[#ede4fa]",
    image: "https://images.unsplash.com/photo-1611224885990-ab7363d1f2a9?auto=format&fit=crop&q=80&w=600&h=400",
    mockupInfo: "Project portfolio",
    active: true
  },
  {
    logo: "FlowForge",
    logoAccent: "CRM",
    title: "AI-first CRM that delivers revenue",
    description: "Automate full customer journey with intuitive CRM, powered by AI.",
    color: "bg-[#c4f3fa]",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600&h=400",
    mockupInfo: "Leads"
  }
];

const AIProducts = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container px-4 md:px-8 max-w-[1400px]">
        <div className="text-center mb-16">
           <div className="text-sm font-bold text-gray-500 mb-2">AI-powered product suite</div>
           <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium leading-tight">
             Solve every work challenge<br />
             with <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI-powered products</span>
           </h2>
           <p className="mt-6 text-gray-600 max-w-2xl mx-auto font-medium">
             Each product solves departmental needs, and together, they power seamless operations across your organization.
           </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {products.map((product, idx) => (
            <div 
              key={idx} 
              className={`min-w-[70vw] md:min-w-[650px] rounded-[32px] ${product.color} snap-center shrink-0 flex flex-col pt-12 px-12 overflow-hidden relative shadow-sm border border-black/5 min-h-[480px]`}
            >
              <div className="flex flex-col md:flex-row gap-8 mb-12 relative z-10">
                 <div className="md:w-1/2">
                   <div className="flex items-center gap-1.5 mb-6">
                     <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-400" />
                     <span className="font-bold text-lg tracking-tight text-gray-900">{product.logo}</span>
                     <span className="font-medium text-lg text-gray-600">{product.logoAccent}</span>
                   </div>
                   <h3 className="text-3xl md:text-4xl font-display font-medium text-gray-900 leading-tight">
                     {product.title}
                   </h3>
                 </div>
                 
                 <div className="md:w-1/2 flex flex-col justify-between">
                   <p className="text-gray-800 font-medium mb-6">
                     {product.description}
                   </p>
                   <Link
                     to="/signup"
                     className="inline-flex items-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 self-start mt-auto"
                   >
                     Get Started <ArrowRight size={16} className="ml-1" />
                   </Link>
                 </div>
              </div>
              
              <div className="w-full mt-auto relative z-0 h-[220px] bg-white rounded-t-2xl shadow-xl overflow-hidden p-6 border border-gray-100 flex flex-col translate-y-4">
                 <div className="text-xl font-bold mb-4">{product.mockupInfo}</div>
                 
                 {/* Fake UI Rows */}
                 <div className="space-y-3 opacity-60">
                    <div className="h-6 bg-gray-100 rounded w-full flex gap-2">
                       <div className="w-1/3 bg-gray-200 rounded" />
                       <div className="w-1/4 bg-blue-100 rounded" />
                       <div className="w-1/4 bg-green-100 rounded" />
                    </div>
                    <div className="h-6 bg-gray-100 rounded w-full flex gap-2">
                       <div className="w-1/3 bg-gray-200 rounded" />
                       <div className="w-1/4 bg-orange-100 rounded" />
                       <div className="w-1/4 bg-red-100 rounded" />
                    </div>
                    <div className="h-6 bg-gray-100 rounded w-full flex gap-2">
                       <div className="w-1/3 bg-gray-200 rounded" />
                       <div className="w-1/4 bg-purple-100 rounded" />
                       <div className="w-1/4 bg-yellow-100 rounded" />
                    </div>
                 </div>

                 {/* Avatar decorations */}
                 <div className="absolute right-8 top-[-20px] bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden border-2 border-white"><img src={`https://i.pravatar.cc/150?u=${idx + 10}`} className="w-full h-full object-cover" /></div>
                   <div>
                      <div className="font-bold text-sm">Action Complete</div>
                      <div className="text-xs text-gray-500">Updated perfectly</div>
                   </div>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronLeft size={24} className="text-gray-500" />
          </button>
          <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronRight size={24} className="text-gray-900" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AIProducts;
