"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import UploadNotesModal from "@/components/UploadNotesModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar 
        mobileOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
        onUploadClick={() => setIsUploadModalOpen(true)} 
      />
      {isMobileNavOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[#F1F3F5] text-[#172033] p-4 md:p-7" key={refreshKey}>
          {children}
        </main>
      </div>

      <UploadNotesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
