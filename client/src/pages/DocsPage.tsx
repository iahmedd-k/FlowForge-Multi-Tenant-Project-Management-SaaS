import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLocation } from "react-router-dom";

const DocsPage = ({ preselectedCategory }: { preselectedCategory?: string }) => {
  const location = useLocation();
  const category = preselectedCategory || location.pathname.substring(1);
  
  let title = "Documentation";
  if (category === "api-docs") title = "API Documentation";
  if (category === "guides") title = "Guides & Tutorials";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex container max-w-7xl pt-10 pb-24 gap-12">
         {/* Sidebar layout */}
         <aside className="w-64 shrink-0 hidden md:block">
            <div className="sticky top-24">
               <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
               <ul className="space-y-3 border-l-2 border-gray-100">
                  {["Authentication", "Projects", "Tasks", "Webhooks", "Users API"].map((item, i) => (
                    <li key={i}>
                       <a href="#" className={`block border-l-2 -ml-[2px] pl-4 text-sm font-medium ${i===0 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
                         {item}
                       </a>
                    </li>
                  ))}
               </ul>
            </div>
         </aside>

         {/* Content */}
         <main className="flex-1 max-w-3xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{title}</h1>
            <p className="text-lg text-gray-600 mb-8">This is a placeholder page for the {title}. Here you will find extensive resources, code snippets, and guides on how to use FlowForge effectively.</p>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8 font-mono text-sm">
               <div className="text-gray-400 mb-2">// Example implementation</div>
               <div className="text-blue-600">const</div> <div className="text-purple-600 inline">api</div> = <div className="text-blue-600 inline">new</div> FlowForge(&#123; <br/>
               &nbsp;&nbsp;apiKey: <div className="text-green-600 inline">"sk_live_..."</div> <br/>
               &#125;);
            </div>

            <h2 className="text-2xl font-bold mb-4 mt-12">Overview</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
         </main>
      </div>
      <Footer />
    </div>
  );
};

export default DocsPage;
