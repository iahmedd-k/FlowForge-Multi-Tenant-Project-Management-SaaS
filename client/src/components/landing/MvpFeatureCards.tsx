import { motion } from "framer-motion";
import { BellRing, CalendarDays, FileText, Sparkles, Users, BarChart3 } from "lucide-react";

const cards = [
  {
    title: "Team Invites",
    text: "Invite members, assign roles, and bring people into the workspace with one flow.",
    icon: Users,
    content: (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Invite teammates</p>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">Workspace</span>
        </div>
        <div className="space-y-2">
          <div className="rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-500">ahmed@team.com</div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-700">Member</div>
            <div className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Invite</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Task Visibility",
    text: "Track status, owners, due dates, and progress from one shared board.",
    icon: FileText,
    content: (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-[1.8fr_1fr_1fr] gap-2 border-b border-gray-100 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          <span>Task</span>
          <span className="text-center">Owner</span>
          <span className="text-center">Status</span>
        </div>
        <div className="space-y-2 pt-3">
          <div className="grid grid-cols-[1.8fr_1fr_1fr] gap-2 items-center text-xs">
            <span className="text-gray-800">Finalize launch plan</span>
            <span className="text-center text-gray-500">Aisha</span>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-center font-medium text-amber-700">Working</span>
          </div>
          <div className="grid grid-cols-[1.8fr_1fr_1fr] gap-2 items-center text-xs">
            <span className="text-gray-800">Review homepage copy</span>
            <span className="text-center text-gray-500">Marcus</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-center font-medium text-emerald-700">Done</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Automations",
    text: "Turn on reminders, mentions, assignment alerts, and deadline warnings that actually work in the MVP.",
    icon: Sparkles,
    content: (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Workspace automations</p>
          <span className="text-[11px] font-medium text-gray-500">6 selected</span>
        </div>
        <div className="space-y-2">
          {["Task Assignment Notification", "Due Date Reminder", "Comment Mention Trigger"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <span>{item}</span>
              <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">On</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Calendar Planning",
    text: "See upcoming work, deadlines, and overdue tasks in a clearer planning view.",
    icon: CalendarDays,
    content: (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">April board calendar</p>
          <span className="text-[11px] text-gray-500">5 tasks due</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400">
          {["S","M","T","W","T","F","S"].map((day, dayIdx) => <span key={`day-${dayIdx}`}>{day}</span>)}
          {Array.from({ length: 14 }).map((_, idx) => (
            <div key={`date-${idx}`} className={`rounded-lg py-2 ${[4,8,11].includes(idx) ? 'bg-blue-50 text-blue-700 font-semibold' : 'bg-gray-50 text-gray-500'}`}>
              {idx + 8}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Reporting",
    text: "Follow completion, workload, and overdue items from live project data.",
    icon: BarChart3,
    content: (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Reporting snapshot</p>
          <span className="text-[11px] text-gray-500">This week</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-gray-400">Done</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">18</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-gray-400">Overdue</p>
            <p className="mt-1 text-lg font-semibold text-red-600">3</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.08em] text-gray-400">Active</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">7</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Notifications",
    text: "Keep the right people updated when assignments, reviews, mentions, and deadlines change.",
    icon: BellRing,
    content: (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Recent alerts</p>
          <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600">3 new</span>
        </div>
        <div className="space-y-2">
          <div className="rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-700">You were assigned "Homepage cleanup"</div>
          <div className="rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-700">"Launch checklist" is ready for review</div>
          <div className="rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-700">Project deadline is approaching</div>
        </div>
      </div>
    ),
  },
];

const MvpFeatureCards = () => (
  <section className="py-10 sm:py-16 md:py-20 lg:py-28">
    <div className="container px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mb-8 sm:mb-12 md:mb-14 max-w-2xl text-center"
      >
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold">
          More of the product, <span className="gradient-text">right on the page</span>
        </h2>
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-muted-foreground">
          A quick look at the MVP features teams can actually use today.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="rounded-lg sm:rounded-2xl md:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 md:p-6 shadow-card"
          >
            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-gray-50 text-gray-700">
              <card.icon size={18} strokeWidth={1.5} />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{card.title}</h3>
            <p className="mt-1.5 sm:mt-2 mb-3 sm:mb-4 md:mb-5 text-xs sm:text-sm leading-relaxed text-gray-500">{card.text}</p>
            <div className="text-xs sm:text-sm overflow-x-auto">
              {card.content}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default MvpFeatureCards;
