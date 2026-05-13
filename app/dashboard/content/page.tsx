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
        <h2 className="mb-1 text-xl font-bold sm:text-2xl">وكيل المحتوى العقاري</h2>
        <p className="hidden text-xs text-[var(--text-soft)] sm:block sm:text-sm">
          منصة ذكاء اصطناعي متكاملة لصناعة المحتوى العقاري — من الفكرة إلى النشر
        </p>
      </div>

      {/* Mobile: dropdown */}
      <div className="mb-4 md:hidden">
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
          <p className="mt-1.5 px-1 text-xs text-[var(--text-faint)]">{activeTabData.desc}</p>
        )}
      </div>

      {/* Desktop: tab buttons */}
      <div
        className="mb-6 hidden gap-2 overflow-x-auto pb-2 md:flex"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={
              "flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-medium whitespace-nowrap transition " +
              (activeTab === tab.id
                ? "bg-[var(--gold-2)] text-white"
                : "border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] text-[var(--text-soft)] hover:border-[var(--gold-bg-hover)] hover:text-[var(--text-strong)]")
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
        <FactoryTab onDraftsCreated={() => setDraftsRefresh((r) => r + 1)} />
      )}
      {activeTab === "expert" && (
        <ExpertTab onDraftsCreated={() => setDraftsRefresh((r) => r + 1)} />
      )}
      {activeTab === "room" && (
        <ContentRoomTab onDraftSaved={() => setDraftsRefresh((r) => r + 1)} />
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
