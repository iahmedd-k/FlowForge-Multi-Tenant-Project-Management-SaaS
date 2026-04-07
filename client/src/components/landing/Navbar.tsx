import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, LayoutDashboard, Kanban, CalendarDays, BarChart3, Users, FileText, HelpCircle, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FlowForgeLogo from "@/components/branding/FlowForgeLogo";

const dropdownMenus: Record<string, { label: string; desc: string; icon: React.ElementType; href: string }[]> = {
  Solutions: [
    { label: "Work Management", desc: "Manage tasks, assignees, due dates, and status", icon: LayoutDashboard, href: "/products/work-management" },
    { label: "Projects", desc: "Track boards, timelines, and team progress", icon: Kanban, href: "/products/projects" },
    { label: "Calendar", desc: "Stay on top of scheduled work and deadlines", icon: CalendarDays, href: "/solutions/project-management" },
    { label: "Reporting", desc: "View workload, overdue tasks, and completion trends", icon: BarChart3, href: "/solutions/sales" },
    { label: "Team Collaboration", desc: "Invite teammates, comment on tasks, and manage roles", icon: Users, href: "/solutions/hr" },
    { label: "Automations", desc: "Use reminders, alerts, mentions, and project warnings", icon: BarChart3, href: "/solutions/enterprise" },
  ],
  Resources: [
    { label: "Help Center", desc: "Find guides for invites, tasks, and workspace setup", icon: HelpCircle, href: "/help" },
    { label: "About", desc: "Learn more about FlowForge and our team", icon: BookOpen, href: "/about" },
    { label: "Templates", desc: "Start faster with ready-made project and task setups", icon: BookOpen, href: "/resources/templates" },
  ],
};

const navLinks = [
  { label: "Home", href: "/", hasDropdown: false },
  { label: "Solutions", hasDropdown: true },
  { label: "Features", href: "/features", hasDropdown: false },
  { label: "Resources", hasDropdown: true },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <FlowForgeLogo to="/" compact />

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {link.hasDropdown ? (
                <button className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {link.label}
                  <ChevronDown size={14} className={`transition-transform ${activeDropdown === link.label ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <a href={link.href} className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {link.label}
                </a>
              )}

              {/* Desktop Dropdown */}
              <AnimatePresence>
                {link.hasDropdown && activeDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full z-50 w-[380px] pt-2"
                  >
                    <div className="rounded-2xl border border-border bg-card p-3 shadow-elevated">
                      <div className="grid gap-1">
                        {dropdownMenus[link.label]?.map((item) => (
                          <Link
                            key={item.label}
                            to={item.href}
                            onClick={() => setActiveDropdown(null)}
                            className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
                          >
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background">
                              <item.icon size={18} className="text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-foreground">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            to="/login"
            className="gradient-cta rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 hover:shadow-elevated"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <div key={link.label}>
                  {link.hasDropdown ? (
                    <>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === link.label ? null : link.label)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                      >
                        {link.label}
                        <ChevronDown size={16} className={`transition-transform ${mobileExpanded === link.label ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {mobileExpanded === link.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 pb-2 pl-3">
                              {dropdownMenus[link.label]?.map((item) => (
                                <Link
                                  key={item.label}
                                  to={item.href}
                                  onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
                                >
                                  <item.icon size={16} className="text-primary" />
                                  <div>
                                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <a
                      href={link.href}
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </a>
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                <Link
                  to="/login"
                  className="gradient-cta rounded-full px-6 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
