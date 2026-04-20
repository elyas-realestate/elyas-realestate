/**
 * تصدير البيانات إلى CSV بدون مكتبات خارجية
 * يعمل مباشرة في المتصفح
 */

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // إذا يحتوي على فاصلة أو علامة اقتباس أو سطر جديد — نحيطه بعلامات اقتباس
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(
  rows: Record<string, unknown>[],
  headers: { key: string; label: string }[],
  filename: string
) {
  if (rows.length === 0) return;

  const headerRow = headers.map(h => escapeCsvCell(h.label)).join(",");
  const dataRows  = rows.map(row =>
    headers.map(h => escapeCsvCell(row[h.key])).join(",")
  );

  // BOM للـ Excel لدعم العربية
  const bom     = "\uFEFF";
  const csv     = bom + [headerRow, ...dataRows].join("\r\n");
  const blob    = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── إعدادات التصدير لكل جدول ──

export const PROPERTIES_EXPORT_HEADERS = [
  { key: "code",         label: "الكود"        },
  { key: "title",        label: "العنوان"       },
  { key: "main_category",label: "التصنيف"      },
  { key: "sub_category", label: "النوع"        },
  { key: "offer_type",   label: "عرض"          },
  { key: "city",         label: "المدينة"      },
  { key: "district",     label: "الحي"         },
  { key: "price",        label: "السعر (ر.س)"  },
  { key: "land_area",    label: "المساحة (م²)" },
  { key: "rooms",        label: "غرف"          },
  { key: "is_published", label: "منشور"        },
  { key: "created_at",   label: "تاريخ الإضافة"},
];

export const CLIENTS_EXPORT_HEADERS = [
  { key: "code",       label: "الكود"         },
  { key: "full_name",  label: "الاسم"         },
  { key: "phone",      label: "الجوال"        },
  { key: "category",   label: "التصنيف"       },
  { key: "city",       label: "المدينة"       },
  { key: "district",   label: "الحي"          },
  { key: "budget",     label: "الميزانية"     },
  { key: "source",     label: "المصدر"        },
  { key: "lead_score", label: "النقاط"        },
  { key: "sentiment",  label: "المشاعر"       },
  { key: "notes",      label: "ملاحظات"       },
  { key: "created_at", label: "تاريخ الإضافة" },
];

export const DEALS_EXPORT_HEADERS = [
  { key: "code",               label: "الكود"            },
  { key: "title",              label: "عنوان الصفقة"     },
  { key: "deal_type",          label: "نوع الصفقة"       },
  { key: "current_stage",      label: "المرحلة"          },
  { key: "priority",           label: "الأولوية"         },
  { key: "target_value",       label: "قيمة الصفقة (ر.س)"},
  { key: "expected_commission",label: "العمولة (ر.س)"    },
  { key: "next_action",        label: "الإجراء التالي"   },
  { key: "expected_close_date",label: "تاريخ الإغلاق"    },
  { key: "created_at",         label: "تاريخ الإنشاء"    },
];
