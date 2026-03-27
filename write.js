const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'dashboard', 'content', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// نحدد بداية كل نسخة مكررة
// النسخة الأولى سطر 428 — نبقيها
// النسخة الثانية سطر 752 — نحذفها (من 729 لأن المتغيرات تبدأ قبلها)
// النسخة الثالثة سطر 1074 — نحذفها

// نحتاج نحذف من بداية التكرار الثاني حتى بداية التكرار الثالث
// ومن بداية التكرار الثالث حتى ComingSoon

// الطريقة الأسهل: نحذف كل شي بين نهاية النسخة الأولى وبداية ComingSoon
// ونبقي النسخة الأولى فقط

// نبحث عن نهاية CalendarTab الأولى (اللي تبدأ بسطر 428)
// CalendarTab الثانية تبدأ بالمتغيرات قبلها

// نحذف من سطر 729 (بداية platformColors الثانية) إلى سطر 1371 (قبل ComingSoon)

let content = lines.join('\n');

// نبحث عن التكرار الثاني لـ platformColors
const firstEnd = content.indexOf('// ====== COMING SOON');
const calendarVars = 'const platformColors: Record<string, string> = {';

// نجد الموقع الأول
const first = content.indexOf(calendarVars);
// نجد الموقع الثاني
const second = content.indexOf(calendarVars, first + 1);

if (second > -1 && firstEnd > -1) {
  // نحذف من الموقع الثاني حتى قبل COMING SOON
  content = content.substring(0, second) + content.substring(firstEnd);
  console.log('Removed duplicate CalendarTab code.');
} else {
  console.log('Could not find duplicates automatically.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! File cleaned.');