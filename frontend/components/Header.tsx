"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  User,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut,
  Cpu,
  Activity,
  Terminal,
} from "lucide-react";
import { getSettings, saveSettings, Settings } from "@/lib/api";

export default function BrutalistHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSettings().then((res) => setSettings(res.settings)).catch(() => { });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    router.push("/landing");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/notes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayName = settings?.displayName || "Student";
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = settings?.role === "admin";
  const roleTitle = isAdmin ? "Administrator" : "Student";

  return (
    <header className="sticky top-0 z-30 border-b-2 border-current bg-background/90 backdrop-blur-md font-mono text-xs">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">

        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="p-2 border-2 border-current hover:bg-[#ea580c] hover:text-white transition-colors md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* System Status Ticker */}
        <div className="hidden lg:flex items-center gap-3 border-2 border-current px-3 py-1.5 bg-background text-[10px] uppercase font-bold tracking-widest">
          <span className="h-2 w-2 bg-[#ea580c] animate-pulse" />
          <span>LATENCY: 4.2MS</span>
          <span className="opacity-30">|</span>
          <span className="text-[#16a34a]">SYS_ONLINE</span>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center justify-center md:justify-start">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH_NOTES(QUERY)..."
              className="brutalist-input py-1.5 pl-9 pr-14 text-xs font-mono"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="hidden sm:inline-block border border-current px-1 py-0.2 text-[9px] font-bold opacity-70">
                CTRL+K
              </kbd>
            </div>
          </div>
        </form>

        {/* Right side profile */}
        <div className="flex items-center gap-3">

          <button className="relative border-2 border-current p-2 hover:bg-[#ea580c] hover:text-white transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-[#ea580c] border border-current" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 border-2 border-current px-2.5 py-1 hover:bg-current hover:text-background transition-colors"
            >
              <div className="grid h-6 w-6 place-items-center bg-[#ea580c] text-white font-bold text-xs">
                {initial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-none">{displayName}</p>
                <p className="text-[9px] opacity-70 uppercase tracking-widest mt-0.5">{roleTitle}</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 border-2 border-current bg-background p-3 shadow-[4px_4px_0px_var(--border)] font-mono text-xs z-50">
                <div className="border-b-2 border-current pb-3 mb-2">
                  <p className="font-bold uppercase">{displayName}</p>
                  <p className="text-[10px] opacity-70 truncate">{settings?.email || "student@studymet.ai"}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 border border-current bg-[#ea580c] text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                    {roleTitle}
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 hover:bg-[#ea580c] hover:text-white transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>MY_PROFILE</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 hover:bg-[#ea580c] hover:text-white transition-colors"
                  >
                    <SettingsIcon className="h-3.5 w-3.5" />
                    <span>SETTINGS</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/students"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-[#ea580c] hover:bg-[#ea580c] hover:text-white font-bold transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>ADMIN_PORTAL</span>
                    </Link>
                  )}
                </div>

                <div className="border-t-2 border-current mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-2.5 py-2 bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>LOGOUT</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
