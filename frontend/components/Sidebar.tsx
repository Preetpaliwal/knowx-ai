"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Cpu,
  Home,
  FileText,
  MessageSquare,
  Zap,
  Calendar,
  User,
  Settings,
  Users,
  Trophy,
  Upload,
  Activity,
  Terminal,
} from "lucide-react";
import { getSettings, Settings as SettingsType } from "@/lib/api";

interface SidebarProps {
  onUploadClick?: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

type NavItem = {
  href: string;
  label: string;
  code: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navigationItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", code: "01", icon: Home },
  { href: "/notes", label: "Notes Library", code: "02", icon: FileText },
  { href: "/chat", label: "AI Study Chat", code: "03", icon: MessageSquare },
  { href: "/quiz", label: "Quiz Studio", code: "04", icon: Zap },
  { href: "/competition", label: "Competitions", code: "05", icon: Trophy },
  { href: "/revision", label: "Revision Tasks", code: "06", icon: Calendar },
  { href: "/profile", label: "Profile", code: "07", icon: User },
  { href: "/settings", label: "Settings", code: "08", icon: Settings },
  { href: "/admin/students", label: "Admin Portal", code: "09", icon: Users, adminOnly: true },
];

export default function BrutalistSidebar({ onUploadClick, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tick, setTick] = useState(1);

  useEffect(() => {
    getSettings()
      .then((res) => {
        setSettings(res.settings);
        setIsAdmin(res.settings?.role === "admin");
      })
      .catch(() => { });

    const timer = setInterval(() => setTick((t) => (t + 1) % 9999), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayName = settings?.displayName || "Student";
  const initial = displayName.charAt(0).toUpperCase();

  const visibleItems = navigationItems.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          fixed md:relative inset-y-0 left-0 z-50
          h-full
          w-[270px] shrink-0
          flex flex-col
          bg-[#E9ECEF]
          border-r-2 border-current
          text-[#0F1629]
          font-mono
          transition-transform duration-200 ease-out
          overflow-hidden
        `}
      >
        {/* Header Logo */}
        <div className="border-b-2 border-current p-5 bg-[#E9ECEF]">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="grid h-8 w-8 place-items-center bg-[#ea580c] text-white border-2 border-current font-bold">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wider uppercase">STUDYMET.AI</p>
              <p className="text-[9px] text-[#ea580c] font-bold uppercase tracking-widest">TICK:{String(tick).padStart(4, "0")}</p>
            </div>
          </Link>
        </div>

        {/* Upload Action */}
        {onUploadClick && (
          <div className="p-4 border-b-2 border-current">
            <button
              onClick={() => {
                onUploadClick();
                onClose?.();
              }}
              className="brutalist-btn-orange w-full justify-center py-2.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-2" />
              UPLOAD NOTES
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[9px] font-bold tracking-widest uppercase opacity-50 px-2 py-1">
            // NAVIGATION_MODULES
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase border-2 transition-all
                  ${active
                    ? "bg-[#ea580c] text-white border-current shadow-[3px_3px_0px_var(--border)]"
                    : "border-transparent hover:border-current hover:bg-current/5"
                  }
                `}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className={`text-[9px] opacity-60 ${active ? "text-white" : "text-current"}`}>
                  [{item.code}]
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="border-t-2 border-current p-4 bg-current/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-8 w-8 place-items-center bg-[#ea580c] text-white font-black text-xs border border-current">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-bold uppercase">{displayName}</p>
              <p className="text-[9px] text-[#ea580c] font-bold uppercase tracking-widest">
                {isAdmin ? "ADMINISTRATOR" : "STUDENT_MODE"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
            <div className="border border-current p-1.5 bg-[#FFFFFF]">
              <span className="block text-[8px] opacity-60">STREAK</span>
              <span className="font-bold text-[#ea580c]">14 DAYS</span>
            </div>
            <div className="border border-current p-1.5 bg-[#FFFFFF]">
              <span className="block text-[8px] opacity-60">ACCURACY</span>
              <span className="font-bold text-[#16a34a]">99.8%</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
