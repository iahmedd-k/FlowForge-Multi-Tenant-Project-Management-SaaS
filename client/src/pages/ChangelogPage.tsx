import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const ChangelogPage = () => {
  const logs = [
    { version: "v2.1.0", date: "April 1, 2026", updates: ["Added FlowForge sidekick inside document editor.", "Improved Gantt chart rendering performance by 40%.", "Fixed bug causing notification delays."] },
    { version: "v2.0.5", date: "March 15, 2026", updates: ["Redesigned main navigation panel for faster access.", "Introduced new reporting widgets.", "Security improvements to webhook API."] },
    { version: "v2.0.0", date: "February 28, 2026", updates: ["Major release: FlowForge UI 2.0 with completely new design language.", "Added native dark mode support.", "Launched AI workflow automations beta."] }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-3xl py-24">
         <h1 className="text-5xl font-display font-medium text-gray-900 mb-6 font-bold">Changelog</h1>
         <p className="text-xl text-gray-500 mb-16">All the latest updates, improvements, and fixes.</p>
         
         <div className="space-y-16">
            {logs.map((log, idx) => (
              <div key={idx} className="relative pl-8 md:pl-0">
                 <div className="md:grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-1 mb-4 md:mb-0">
                       <span className="block text-sm font-bold text-blue-600 mb-1">{log.version}</span>
                       <span className="text-xs font-medium text-gray-500">{log.date}</span>
                    </div>
                    <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <ul className="space-y-3">
                         {log.updates.map((up, i) => (
                           <li key={i} className="flex gap-3 text-gray-700 text-sm">
                             <span className="text-gray-300">•</span> {up}
                           </li>
                         ))}
                       </ul>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChangelogPage;
