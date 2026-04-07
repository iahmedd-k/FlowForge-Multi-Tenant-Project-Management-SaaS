import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

const columns = [
  {
    title: "To Do",
    color: "border-t-brand-blue",
    items: [
      { label: "Research competitors", tag: "Research", tagColor: "bg-brand-blue" },
      { label: "Write blog post", tag: "Content", tagColor: "bg-brand-purple" },
    ],
  },
  {
    title: "In Progress",
    color: "border-t-brand-orange",
    items: [
      { label: "Design landing page", tag: "Design", tagColor: "bg-brand-pink" },
      { label: "Build API endpoints", tag: "Dev", tagColor: "bg-brand-green" },
      { label: "Create email templates", tag: "Marketing", tagColor: "bg-brand-orange" },
    ],
  },
  {
    title: "Review",
    color: "border-t-brand-purple",
    items: [
      { label: "QA testing round 2", tag: "QA", tagColor: "bg-brand-yellow" },
    ],
  },
  {
    title: "Done",
    color: "border-t-brand-green",
    items: [
      { label: "Setup CI/CD pipeline", tag: "DevOps", tagColor: "bg-brand-blue" },
      { label: "User interviews", tag: "Research", tagColor: "bg-brand-purple" },
    ],
  },
];

const Showcase = () => (
  <section className="py-20 md:py-28">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <h2 className="font-display text-3xl font-extrabold md:text-4xl">
          Visualize work <span className="gradient-text">your way</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Kanban boards, timelines, calendars — pick the view that works best for you.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="overflow-x-auto rounded-2xl border border-border bg-card p-6 shadow-elevated"
      >
        <div className="grid min-w-[700px] grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.title} className={`rounded-xl border border-border bg-muted/40 p-4 border-t-4 ${col.color}`}>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">{col.title}</h4>
                <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
                  {col.items.length}
                </span>
              </div>
              <div className="space-y-3">
                {col.items.map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.02 }}
                    className="group cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-card"
                  >
                    <div className="mb-2 flex items-center gap-1">
                      <GripVertical size={14} className="text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary-foreground ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default Showcase;
