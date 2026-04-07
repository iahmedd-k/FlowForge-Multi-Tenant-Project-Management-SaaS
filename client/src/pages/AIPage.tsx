import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Bot, 
  Workflow, 
  BrainCircuit, 
  Cpu
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const aiData: Record<string, { title: string; tagline: string; description: string; icon: React.ElementType; color: string; features: string[] }> = {
  agents: {
    title: "AI Agents",
    tagline: "Custom conversational agents designed for your workflows",
    description: "Deploy intelligent agents that understand your business logic and can act autonomously to resolve issues, answer questions, and automate processes.",
    icon: Bot,
    color: "bg-blue-500",
    features: ["Custom agent training", "Integration with existing tools", "Natural language processing", "Automated issue resolution", "24/7 availability", "Continuous learning"],
  },
  workflows: {
    title: "AI Workflows",
    tagline: "Automate your most complex processes",
    description: "Let AI handle the heavy lifting. Build intelligent workflows that can parse unstructured data, route requests based on sentiment, and trigger cross-platform actions.",
    icon: Workflow,
    color: "bg-purple-500",
    features: ["Visual workflow builder", "Sentiment analysis routing", "Unstructured data parsing", "Cross-app automations", "Conditional logic trees", "Execution history & logs"],
  },
  insights: {
    title: "AI Insights",
    tagline: "Deep data analysis and predictive modeling",
    description: "Transform your raw data into actionable intelligence. Use AI predictive models to forecast trends, identify risks, and surface opportunities you might have missed.",
    icon: BrainCircuit,
    color: "bg-teal-500",
    features: ["Predictive forecasting", "Risk identification", "Automated reporting", "Anomaly detection", "Natural language queries", "Custom dashboards"],
  },
};

const AIPage = () => {
  const { slug } = useParams();
  const data = aiData[slug || ""] || aiData["agents"];

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden py-20 md:py-28 bg-[#fbfbfe]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[100px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[100px] -translate-x-1/3 translate-y-1/3" />
        </div>
        
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${data.color} shadow-lg shadow-${data.color.split('-')[1]}-500/20`}>
              <data.icon size={32} className="text-white" />
            </div>
            
            <h1 className="font-display text-4xl font-extrabold md:text-5xl lg:text-6xl text-gray-900 leading-tight">
              FlowForge <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{data.title}</span>
            </h1>
            
            <p className="mt-4 text-xl text-gray-600 font-medium">{data.tagline}</p>
            <p className="mx-auto mt-6 max-w-xl text-base text-gray-500 leading-relaxed">{data.description}</p>
            
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3.5 font-semibold text-white shadow-soft transition-all hover:bg-gray-800 hover:shadow-elevated">
                Get Started <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/contact" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-8 py-3.5 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                Contact Sales
              </Link>
            </div>
            
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto mt-24 max-w-[800px]">
            <h2 className="mb-10 text-center font-display text-3xl font-bold text-gray-900">Key Capabilities</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {data.features.map((f, i) => (
                <motion.div 
                  key={f} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.3 + i * 0.05 }} 
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-8 h-8 rounded-full ${data.color} bg-opacity-10 flex items-center justify-center shrink-0`}>
                     <CheckCircle2 size={18} className={data.color.replace('bg-', 'text-')} />
                  </div>
                  <span className="text-base font-medium text-gray-800">{f}</span>
                </motion.div>
              ))}
            </div>
            
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AIPage;
