import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { CalendarDays, FolderKanban, Home, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useIsMobile } from '../../../hooks/use-mobile';

function MobileBottomNav() {
  const items = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/calendar', label: 'My work', icon: CalendarDays },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#d9e0ef] bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-[12px] px-2 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? 'bg-[#e8f0fe] text-[#185abc]'
                    : 'text-[#5f6f8b] hover:bg-[#f3f6fb]'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.9} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f6fb]">
      <TopBar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'pb-20' : ''}`}>
            <Outlet />
          </main>
        </div>
      </div>
      {isMobile ? <MobileBottomNav /> : null}
    </div>
  );
}
