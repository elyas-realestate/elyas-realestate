"use client";

import { useState, useEffect } from "react";
import { tabs } from "./constants";
import GrowthNav from "@/app/components/GrowthNav";

// ── Lazy-loaded tabs (code splitting) ──
import IdentityTab from "./components/IdentityTab";
import FactoryTab from "./components/FactoryTab";
import ExpertTab from "./components/ExpertTab";
import ContentRoomTab from "./components/ContentRoomTab";
import DraftsTab from "./components/DraftsTab";
import CalendarTab from "./components/CalendarTab";
import TrendsTab from "./components/TrendsTab";

export default function ContentAI() {
  const [activeTab, setActiveTab] = useState("identity");
  const [draftsRefresh, setDraftsRefresh] = useState(0);
  const activeTabData = tabs.find((t) => t.id === activeTab);

  useEffect(() => {
    const saved = localStorage.getItem("contentTab");
    if (saved && tabs.find((t) => t.id === saved)) setActiveTab(saved);
  }, []);

  function switchTab(id: string) {
    setActiveTab(id);
    localStorage.setItem("contentTab", id);
  }

  return (
    <div dir="rtl">
      <GrowthNav />

      {/* Page Title */}
      <div className="mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-1">
          وكيل المحتوى العقاري
        </h2>
        <p className="text-[var(--text-soft)] text-xs sm:text-sm hidden sm:block">
          منصة ذكاء اصطناعي متكاملة لصناعة المحتوى العقاري — من الفكرة إلى
          النشر
        </p>
      </div>

      {/* Mobile: dropdown */}
      <div className="md:hidden mb-4">
        <select
          value={activeTab}
          onChange={(e) => switchTab(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none"
          style={{
            background: "var(--bg-surface-1)",
            border: "1px solid rgba(198,145,76,0.25)",
            color: "var(--text-strong)",
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
        {activeTabData && (
          <p className="text-xs text-[var(--text-faint)] mt-1.5 px-1">
            {activeTabData.desc}
          </p>
        )}
      </div>

      {/* Desktop: tab buttons */}
      <div
        className="hidden md:flex gap-2 mb-6 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={
              "flex items-center gap-1.5 rounded-xl font-medium transition whitespace-nowrap text-sm px-4 py-3 " +
              (activeTab === tab.id
                ? "bg-[var(--gold-2)] text-white"
                : "bg-[var(--bg-surface-1)] border border-[var(--gold-bg)] text-[var(--text-soft)] hover:text-[var(--text-strong)] hover:border-[var(--gold-bg-hover)]")
            }
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "identity" && <IdentityTab />}
      {activeTab === "factory" && (
        <FactoryTab
          onDraftsCreated={() => setDraftsRefresh((r) => r + 1)}
        />
      )}
      {activeTab === "expert" && (
        <ExpertTab
          onDraftsCreated={() => setDraftsRefresh((r) => r + 1)}
        />
      )}
      {activeTab === "room" && (
        <ContentRoomTab
          onDraftSaved={() => setDraftsRefresh((r) => r + 1)}
        />
      )}
      {activeTab === "drafts" && <DraftsTab refreshKey={draftsRefresh} />}
      {activeTab === "calendar" && (
        <CalendarTab
          refreshKey={draftsRefresh}
          onDraftsCreated={() => setDraftsRefresh((r) => r + 1)}
        />
      )}
      {activeTab === "trends" && (
        <TrendsTab
          onSendToFactory={() => {
            switchTab("factory");
          }}
        />
      )}
    </div>
  );
}
