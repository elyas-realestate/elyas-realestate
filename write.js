const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'dashboard', 'content', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const trendsTab = `
// ====== TRENDS TAB ======
const saudiEvents: Record<number, { date: string; title: string; type: string; contentIdea: string }[]> = {
  1: [
    { date: "1 يناير", title: "رأس السنة الميلادية", type: "مناسبة", contentIdea: "أهداف عقارية للسنة الجديدة — خطط لاستثمارك العقاري" },
    { date: "يناير", title: "موسم الإيجارات الشتوي", type: "سوق", contentIdea: "نصائح للمستأجرين في موسم الشتاء — كيف تختار الشقة المناسبة" },
  ],
  2: [
    { date: "22 فبراير", title: "يوم التأسيس السعودي", type: "مناسبة", contentIdea: "من بيوت الطين إلى الأبراج — تطور العقار السعودي منذ التأسيس" },
    { date: "فبراير", title: "اجتماعات البنك المركزي", type: "سوق", contentIdea: "تأثير قرارات الفائدة على السوق العقاري السعودي" },
  ],
  3: [
    { date: "مارس", title: "بداية موسم البيع الربيعي", type: "سوق", contentIdea: "الربيع = موسم شراء العقارات — لماذا هذا الوقت مثالي للمشتري؟" },
    { date: "مارس", title: "معرض ريستاتكس العقاري", type: "سوق", contentIdea: "أبرز ما جاء في معرض ريستاتكس — فرص وعروض عقارية" },
  ],
  4: [
    { date: "أبريل", title: "موسم الصيف يقترب", type: "سوق", contentIdea: "استعد لموسم الإيجارات الصيفي — نصائح للملاك والمستأجرين" },
    { date: "أبريل", title: "تحديثات أنظمة إيجار", type: "سوق", contentIdea: "كل ما تحتاج معرفته عن تحديثات منصة إيجار" },
  ],
  5: [
    { date: "مايو", title: "نهاية العام الدراسي", type: "مناسبة", contentIdea: "موسم الانتقالات العائلية — كيف تختار حيك الجديد في الرياض" },
    { date: "مايو", title: "ارتفاع الطلب على الفلل", type: "سوق", contentIdea: "لماذا يرتفع الطلب على الفلل في الصيف؟ تحليل سوقي" },
  ],
  6: [
    { date: "يونيو", title: "بداية الإجازة الصيفية", type: "مناسبة", contentIdea: "الإجازة الصيفية فرصة للبحث عن عقار — دليل المشتري" },
    { date: "يونيو", title: "موسم الاستراحات", type: "سوق", contentIdea: "الاستثمار في الاستراحات — هل هو مجدي في الرياض؟" },
  ],
  7: [
    { date: "يوليو", title: "ذروة الصيف", type: "سوق", contentIdea: "أحياء الرياض الأكثر طلباً في الصيف — تحليل بيانات" },
    { date: "يوليو", title: "موسم السياحة الداخلية", type: "مناسبة", contentIdea: "العقارات السياحية في السعودية — فرصة استثمارية" },
  ],
  8: [
    { date: "أغسطس", title: "قرب العام الدراسي الجديد", type: "مناسبة", contentIdea: "أفضل الأحياء للعائلات قرب المدارس المميزة في الرياض" },
    { date: "أغسطس", title: "حركة نقل الموظفين", type: "سوق", contentIdea: "نصائح للموظف المنتقل — كيف تجد سكن مناسب بسرعة" },
  ],
  9: [
    { date: "23 سبتمبر", title: "اليوم الوطني السعودي", type: "مناسبة", contentIdea: "إنجازات القطاع العقاري السعودي — أرقام تفخر بها" },
    { date: "سبتمبر", title: "بداية العام الدراسي", type: "مناسبة", contentIdea: "ارتفاع الطلب على الشقق قرب الجامعات — فرصة للملاك" },
  ],
  10: [
    { date: "أكتوبر", title: "موسم الرياض", type: "مناسبة", contentIdea: "تأثير موسم الرياض على أسعار العقارات والإيجارات" },
    { date: "أكتوبر", title: "معارض عقارية", type: "سوق", contentIdea: "أبرز المعارض العقارية في الربع الأخير — لا تفوتها" },
  ],
  11: [
    { date: "نوفمبر", title: "يوم العقار السعودي", type: "سوق", contentIdea: "مستقبل العقار السعودي — رؤية 2030 والفرص القادمة" },
    { date: "نوفمبر", title: "تقارير السوق الربعية", type: "سوق", contentIdea: "قراءة في تقرير السوق العقاري للربع الثالث" },
  ],
  12: [
    { date: "ديسمبر", title: "نهاية السنة", type: "مناسبة", contentIdea: "ملخص السوق العقاري هذا العام — أرقام وتحليلات" },
    { date: "ديسمبر", title: "موسم التخطيط", type: "سوق", contentIdea: "خطط استثمارك العقاري للسنة القادمة — دليل شامل" },
  ],
};

const riyadhTrendingAreas = [
  { name: "حي النرجس", trend: "صاعد", reason: "قرب من طريق الملك سلمان، مشاريع سكنية جديدة" },
  { name: "حي الملقا", trend: "مستقر مرتفع", reason: "موقع استراتيجي، طلب عالي على الفلل" },
  { name: "حي العارض", trend: "صاعد بقوة", reason: "أسعار معقولة مع تطور البنية التحتية" },
  { name: "حي الياسمين", trend: "مستقر", reason: "حي عائلي مكتمل الخدمات" },
  { name: "حي القيروان", trend: "صاعد", reason: "توسع عمراني سريع وأسعار تنافسية" },
  { name: "حي الصحافة", trend: "صاعد", reason: "قرب من مركز الملك عبدالله المالي" },
  { name: "حي المهدية", trend: "صاعد", reason: "مشاريع سكنية جديدة وأسعار مناسبة" },
  { name: "حي الرمال", trend: "صاعد بقوة", reason: "شرق الرياض، مشاريع ضخمة قادمة" },
  { name: "حي طويق", trend: "مستقر", reason: "غرب الرياض، أسعار معقولة للعائلات" },
  { name: "حي الشفا", trend: "مستقر مرتفع", reason: "جنوب الرياض، طلب متزايد" },
];

const marketTopics = [
  { title: "أسعار الفائدة وتأثيرها على التمويل العقاري", icon: "📊" },
  { title: "تحديثات نظام الوساطة العقارية", icon: "📋" },
  { title: "رسوم الأراضي البيضاء", icon: "🏗️" },
  { title: "برنامج سكني وخيارات الدعم", icon: "🏠" },
  { title: "تحديثات منصة إيجار", icon: "📝" },
  { title: "رؤية 2030 والقطاع العقاري", icon: "🎯" },
  { title: "الاستثمار الأجنبي في العقار السعودي", icon: "🌍" },
  { title: "مشاريع البنية التحتية الجديدة في الرياض", icon: "🚇" },
  { title: "أسعار مواد البناء وتأثيرها", icon: "🧱" },
  { title: "التقنية العقارية PropTech", icon: "💡" },
];

function TrendsTab({ onSendToFactory }: { onSendToFactory: (idea: string) => void }) {
  const [activeSection, setActiveSection] = useState("events");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [identity, setIdentity] = useState<any>(null);
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");

  useEffect(() => { (async () => { const { data } = await supabase.from("broker_identity").select("*").limit(1).single(); if (data) setIdentity(data); })(); }, []);

  async function generateIdeas(topic: string) {
    setGenerating(true); setGeneratedIdeas([]);
    const identityInfo = identity ? "اسم الوسيط: " + identity.broker_name + "\\nالتخصص: " + identity.specialization + "\\nالمنطقة: " + (identity.coverage_areas || []).join("، ") : "";
    const systemPrompt = "أنت خبير محتوى عقاري سعودي. مهمتك توليد أفكار محتوى إبداعية ومتنوعة للسوشال ميديا.\\n\\nهوية الوسيط:\\n" + identityInfo;
    const userPrompt = "ولّد 8 أفكار محتوى عقاري متنوعة مرتبطة بهذا الموضوع:\\n" + topic + "\\n\\nلكل فكرة اكتب:\\n- عنوان الفكرة\\n- وصف مختصر (سطر واحد)\\n- المنصة المقترحة\\n- الصيغة المقترحة (تغريدة/ريلز/كاروسيل)\\n\\nرقّم الأفكار من 1 إلى 8.";
    try {
      const res = await fetch("/api/ai-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemPrompt, userPrompt, provider: aiProvider, model: aiModel }) });
      const data = await res.json();
      if (data.result) {
        const ideas = data.result.split(/\\n\\d+[\\.\\)]\\s*/g).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
        setGeneratedIdeas(ideas.length > 0 ? ideas : [data.result]);
      }
    } catch (err) { setGeneratedIdeas(["حدث خطأ في التوليد"]); }
    setGenerating(false);
  }

  function copyIdea(idx: number, text: string) { navigator.clipboard.writeText(text); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(-1), 2000); }

  const sections = [
    { id: "events", label: "مناسبات الشهر", icon: "📅" },
    { id: "market", label: "أخبار السوق", icon: "📊" },
    { id: "areas", label: "أحياء صاعدة", icon: "📍" },
    { id: "generate", label: "توليد أفكار AI", icon: "🤖" },
  ];

  const trendColor: Record<string, string> = { "صاعد بقوة": "text-green-400 bg-green-900/30", "صاعد": "text-green-300 bg-green-900/20", "مستقر مرتفع": "text-blue-400 bg-blue-900/30", "مستقر": "text-gray-400 bg-gray-800" };

  return (
    <div>
      <div className="mb-6"><h3 className="text-xl font-bold mb-2">ترندات ومناسبات عقارية</h3><p className="text-gray-400 text-sm">أفكار محتوى مرتبطة بالسوق والمناسبات — اضغط على أي فكرة لإرسالها لمصنع المحتوى</p></div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition whitespace-nowrap " + (activeSection === s.id ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}><span>{s.icon}</span>{s.label}</button>
        ))}
      </div>

      {activeSection === "events" && (
        <div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {arabicMonths.map((m, idx) => (
              <button key={idx} onClick={() => setSelectedMonth(idx + 1)} className={"px-3 py-2 rounded-lg text-xs transition whitespace-nowrap " + (selectedMonth === idx + 1 ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}>{m}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(saudiEvents[selectedMonth] || []).map((event, idx) => (
              <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition">
                <div className="flex items-center gap-2 mb-3">
                  <span className={"text-xs px-2 py-1 rounded " + (event.type === "مناسبة" ? "bg-purple-900/30 text-purple-400" : "bg-blue-900/30 text-blue-400")}>{event.type}</span>
                  <span className="text-xs text-gray-500">{event.date}</span>
                </div>
                <h4 className="font-bold mb-2">{event.title}</h4>
                <p className="text-gray-400 text-sm mb-4">{event.contentIdea}</p>
                <div className="flex gap-2">
                  <button onClick={() => onSendToFactory(event.contentIdea)} className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">أرسل لمصنع المحتوى</button>
                  <button onClick={() => generateIdeas(event.title + " — " + event.contentIdea)} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">ولّد أفكار AI</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "market" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketTopics.map((topic, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{topic.icon}</span>
                <h4 className="font-bold">{topic.title}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onSendToFactory(topic.title)} className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">أرسل لمصنع المحتوى</button>
                <button onClick={() => generateIdeas(topic.title)} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">ولّد أفكار AI</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "areas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riyadhTrendingAreas.map((area, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">{area.name}</h4>
                <span className={"text-xs px-2 py-1 rounded " + (trendColor[area.trend] || "bg-gray-800 text-gray-400")}>{area.trend}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">{area.reason}</p>
              <div className="flex gap-2">
                <button onClick={() => onSendToFactory("محتوى عن " + area.name + " — " + area.reason)} className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">أرسل لمصنع المحتوى</button>
                <button onClick={() => generateIdeas(area.name + " في الرياض — " + area.reason)} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">ولّد أفكار AI</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "generate" && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <h4 className="font-bold text-blue-400 text-sm mb-4">توليد أفكار محتوى بالذكاء الاصطناعي</h4>
            <div className="flex gap-3 mb-4">
              <select value={aiProvider} onChange={e => { setAiProvider(e.target.value); const prov = providers.find(p => p.id === e.target.value); if (prov) setAiModel(prov.models[0].id); }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {providers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <select value={aiModel} onChange={e => setAiModel(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {providers.find(p => p.id === aiProvider)?.models.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>
            <div className="flex gap-3">
              <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="اكتب موضوع أو ترند تبي أفكار محتوى عنه..." className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500" onKeyDown={e => { if (e.key === "Enter" && customTopic.trim()) generateIdeas(customTopic); }} />
              <button onClick={() => { if (customTopic.trim()) generateIdeas(customTopic); }} disabled={generating || !customTopic.trim()} className={"px-6 py-3 rounded-lg font-bold transition flex items-center gap-2 " + (generating ? "bg-gray-700 text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white")}>{generating ? <><Loader2 size={16} className="animate-spin" /> جاري التوليد...</> : <><Sparkles size={16} /> ولّد أفكار</>}</button>
            </div>
          </div>

          {generating && (<div className="text-center py-12"><Loader2 size={40} className="text-blue-400 animate-spin mx-auto mb-4" /><p className="text-gray-400">الذكاء الاصطناعي يولّد أفكار محتوى...</p></div>)}

          {generatedIdeas.length > 0 && !generating && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm mb-2">{generatedIdeas.length} فكرة محتوى</h4>
              {generatedIdeas.map((idea, idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">{idea}</p>
                  <div className="flex gap-2">
                    <button onClick={() => onSendToFactory(idea.split("\\n")[0])} className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">أرسل لمصنع المحتوى</button>
                    <button onClick={() => copyIdea(idx, idea)} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition">{copiedIdx === idx ? "نُسخ ✓" : "نسخ"}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;

// نضيف TrendsTab قبل COMING SOON
const comingSoonIdx = content.indexOf('// ====== COMING SOON');
if (comingSoonIdx > -1) {
  content = content.slice(0, comingSoonIdx) + trendsTab + '\n' + content.slice(comingSoonIdx);
}

// نستبدل استدعاء الترندات القديم
content = content.replace(
  '{activeTab === "trends" && <ComingSoon title="ترندات ومناسبات" desc="اقتراحات محتوى مرتبطة بأخبار السوق العقاري والمناسبات" />}',
  '{activeTab === "trends" && <TrendsTab onSendToFactory={(idea) => { setActiveTab("factory"); }} />}'
);

fs.writeFileSync(filePath, content, 'utf8');

// نتحقق من عدم التكرار
const check = fs.readFileSync(filePath, 'utf8');
const count = (check.match(/function TrendsTab/g) || []).length;
console.log('TrendsTab count: ' + count + (count === 1 ? ' ✓' : ' ⚠️ duplicates found!'));
console.log('Done! Trends tab added.');
console.log('Restart: taskkill /f /im node.exe && npm run dev');