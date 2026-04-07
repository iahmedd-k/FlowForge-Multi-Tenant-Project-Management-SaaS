import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import usePageMeta from "@/hooks/usePageMeta";
import { CheckCircle2, ChevronRight, LayoutDashboard, ListTodo, BarChart3, Users } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: LayoutDashboard,
    title: "Kanban board",
    description: "Visualize your workflow moving across configurable columns. Perfect for teams that need clearer ownership and faster execution.",
    bullets: [
      "Built for the current FlowForge MVP",
      "Matches the live dashboard experience",
      "Keeps active work easy to scan",
    ],
    preview: (
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Website launch board</p>
            <p className="text-xs text-gray-500">4 columns, 12 active tasks</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">Live</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "To do", items: ["Draft launch copy", "Add invite flow"] },
            { title: "Working", items: ["Review pricing", "Update reports"] },
            { title: "Done", items: ["Fix automations", "Clean navbar"] },
          ].map((column) => (
            <div key={column.title} className="rounded-2xl bg-gray-50 p-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{column.title}</p>
              <div className="space-y-2">
                {column.items.map((item) => (
                  <div key={item} className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: ListTodo,
    title: "Task management",
    description: "Assign owners, set due dates, update status, and keep everyday execution moving.",
    bullets: [
      "Task titles, owners, dates, and status in one place",
      "Supports the current inline editing flow",
      "Works for both planning and review stages",
    ],
    preview: (
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-4 grid grid-cols-[1.8fr_1fr_1fr_1fr] gap-3 border-b border-gray-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          <span>Task</span>
          <span className="text-center">Owner</span>
          <span className="text-center">Due</span>
          <span className="text-center">Status</span>
        </div>
        <div className="space-y-3">
          {[
            ["Finalize homepage", "Aisha", "Apr 9", "Working"],
            ["Invite product team", "Hassan", "Apr 10", "Review"],
            ["Check launch checklist", "Sara", "Apr 12", "Planned"],
          ].map(([task, owner, due, status]) => (
            <div key={task} className="grid grid-cols-[1.8fr_1fr_1fr_1fr] items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm">
              <span className="font-medium text-gray-800">{task}</span>
              <span className="text-center text-gray-500">{owner}</span>
              <span className="text-center text-gray-500">{due}</span>
              <span className="rounded-full bg-white px-2 py-1 text-center text-xs font-semibold text-gray-700 shadow-sm">{status}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Reporting",
    description: "Track completion, overdue work, workload, and project progress from live workspace data.",
    bullets: [
      "Weekly progress and overdue visibility",
      "Based on actual workspace activity",
      "Useful for managers and contributors",
    ],
    preview: (
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Reporting snapshot</p>
            <p className="text-xs text-gray-500">Current week overview</p>
          </div>
          <span className="text-xs font-medium text-gray-400">Updated now</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.08em] text-gray-400">Done</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">18</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.08em] text-gray-400">Overdue</p>
            <p className="mt-2 text-2xl font-semibold text-rose-600">3</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.08em] text-gray-400">Workload</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">74%</p>
          </div>
        </div>
        <div className="mt-5 flex items-end gap-2">
          {[44, 68, 55, 78, 64, 82, 70].map((height, index) => (
            <div key={height} className="flex-1">
              <div className="rounded-t-2xl bg-blue-100" style={{ height }} />
              <p className="mt-2 text-center text-[10px] text-gray-400">{["M", "T", "W", "T", "F", "S", "S"][index]}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Chat in context. Comment on tasks, mention coworkers, and leave feedback directly on deliverables.",
    bullets: [
      "Supports member invites and mentions",
      "Keeps updates attached to work items",
      "Reduces scattered communication",
    ],
    preview: (
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Team activity</p>
            <p className="text-xs text-gray-500">Mentions, comments, and invites</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">3 updates</span>
        </div>
        <div className="space-y-3">
          {[
            '@ahmed added to "Homepage cleanup"',
            '@sara mentioned you in launch checklist',
            "2 workspace invites are still pending",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const FeaturesPage = () => {
  usePageMeta("Features | FlowForge", "Explore FlowForge features for boards, task management, reporting, and team collaboration.");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="bg-white border-b border-gray-200 pt-24 pb-16">
          <div className="container max-w-4xl text-center">
            <h1 className="text-5xl font-display font-medium text-gray-900 mb-6 tracking-tight">Core features for real team work</h1>
            <p className="text-xl text-gray-500 mb-10 leading-relaxed font-medium">FlowForge brings together the practical tools your team needs to plan, track, and deliver work in one interface.</p>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5">
               Start Free <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        <div className="container max-w-6xl py-24">
           {features.map((feat, idx) => (
             <div key={feat.title} className={`mb-28 grid items-center gap-14 last:mb-0 md:grid-cols-2 ${idx % 2 === 1 ? 'md:[&>div:first-child]:order-2 md:[&>div:last-child]:order-1' : ''}`}>
                <div>
                   <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                     <feat.icon size={28} />
                   </div>
                   <h2 className="text-3xl font-display font-medium text-gray-900 mb-6">{feat.title}</h2>
                   <p className="text-lg text-gray-600 leading-relaxed">{feat.description}</p>

                   <ul className="mt-8 space-y-4">
                     {feat.bullets.map((item) => (
                       <li key={item} className="flex items-center gap-3 text-gray-700 font-medium">
                         <CheckCircle2 size={20} className="text-green-500" />
                         <span>{item}</span>
                       </li>
                     ))}
                   </ul>
                </div>
                <div className="w-full">
                  {feat.preview}
                </div>
             </div>
           ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
