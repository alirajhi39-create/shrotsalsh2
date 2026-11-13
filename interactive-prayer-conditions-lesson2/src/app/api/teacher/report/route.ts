import { teacherSessionFromRequest } from "@/lib/auth";
import { loadTeacherData, isStruggling, type StudentRow } from "@/lib/teacher-data";
import { SLIDES, SKILLS, LESSON } from "@/lib/content";

export const dynamic = "force-dynamic";

/** تقرير A4 عربي بسيط قابل للطباعة/الحفظ كـPDF من المتصفح (بدون مكتبات خارجية) */
function esc(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: Request) {
  const session = await teacherSessionFromRequest(req);
  if (!session) return new Response("غير مصرح", { status: 401 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") === "students" ? "students" : "overview";
  const classroomId = Number(url.searchParams.get("classroomId") || 0);

  const data = await loadTeacherData(session.teacherId);
  const list: StudentRow[] = (classroomId ? data.students.filter((s) => s.classroomId === classroomId) : data.students).slice();
  const roomName = classroomId ? data.rooms.find((r) => r.id === classroomId)?.name ?? "" : "جميع الفصول";

  const started = data.students.filter((s) => s.completedSlides.length > 0 || s.currentSlide);
  const withAttempt = data.students.filter((s) => s.bestPercent !== null);
  const avg = withAttempt.length ? withAttempt.reduce((a, s) => a + (s.bestPercent ?? 0), 0) / withAttempt.length : 0;
  const passed = withAttempt.filter((s) => (s.bestPercent ?? 0) >= data.passPercent).length;
  const finished = data.students.filter((s) => s.completedAt);
  const certified = data.students.filter((s) => s.certificateSerial).length;
  const struggling = list.filter((sg2) => isStruggling(sg2, data.passPercent));

  const stationData = SLIDES.map((s) => ({
    title: s.title,
    count: data.students.filter((x) => x.completedSlides.includes(s.key)).length,
  }));
  const skillData = SKILLS.map((sk) => ({ skill: sk, count: data.students.filter((x) => x.weakSkills.includes(sk)).length }));

  const barFor = (val: number, maxVal: number) => {
    const pct = maxVal ? Math.min(100, Math.round((val / maxVal) * 100)) : 0;
    const cls = pct >= 70 ? "bar" : pct >= 40 ? "bar warn" : "bar bad";
    return `<div class="${cls}"><i style="width:${pct}%"></i><b>${pct}%</b></div>`;
  };

  const studentRows = list
    .map(
      (stu, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="b">${esc(stu.name)}</td><td>${esc(stu.classroom)}</td>
      <td class="c mono">${esc(stu.resumeCode)}</td>
      <td>${barFor(stu.completionPct, 100)}</td>
      <td class="c">${stu.points}</td><td class="c">${stu.stars}</td>
      <td class="c">${stu.bestPercent === null ? '<span class="tag n">لم يؤدِّ</span>' : `<span class="tag ${stu.bestPercent >= data.passPercent ? "g" : "r"}">${Math.round(stu.bestPercent)}%</span>`}</td>
      <td class="c">${stu.attempts}</td>
      <td class="c">${stu.certificateSerial ? '<span class="tag g">حصل عليها</span>' : '<span class="tag n">—</span>'}</td>
      <td>${stu.weakSkills.length ? esc(stu.weakSkills.join("، ")) : "—"}</td>
    </tr>`,
    )
    .join("");

  const stationRows = stationData
    .map((st) => `<tr><td class="b">${esc(st.title)}</td><td class="c">${st.count}</td><td>${barFor(st.count, Math.max(1, started.length))}</td></tr>`)
    .join("");

  const skillRows = skillData
    .map((sk2) => `<tr><td class="b">${esc(sk2.skill)}</td><td class="c">${sk2.count}</td><td>${barFor(sk2.count, Math.max(1, data.students.length))}</td></tr>`)
    .join("");

  const struggleRows = struggling.length
    ? struggling
        .map(
          (sg) =>
            `<tr><td class="b">${esc(sg.name)}</td><td>${esc(sg.classroom)}</td><td class="c">${sg.completionPct}%</td><td class="c">${
              sg.bestPercent === null ? "—" : Math.round(sg.bestPercent) + "%"
            }</td><td>${esc(sg.weakSkills.join("، ") || "—")}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="c muted">لا يوجد طلاب متعثرون 🎉</td></tr>`;

  const statsGrid = `
    <div class="cards">
      <div class="card c1"><span>إجمالي الطلاب</span><b>${data.students.length}</b></div>
      <div class="card c2"><span>بدؤوا الدرس</span><b>${started.length}</b></div>
      <div class="card c3"><span>متوسط الاختبار</span><b>${Math.round(avg)}%</b></div>
      <div class="card c4"><span>اجتازوا (${data.passPercent}%)</span><b>${passed}/${withAttempt.length}</b></div>
      <div class="card c5"><span>أكملوا الدرس</span><b>${finished.length}</b></div>
      <div class="card c6"><span>شهادات صادرة</span><b>${certified}</b></div>
    </div>`;

  const studentsTable = `
    <h2>تفاصيل الطلاب (${list.length})</h2>
    <table>
      <thead><tr><th>#</th><th>الطالب</th><th>الفصل</th><th>رمز الاستكمال</th><th>الإكمال</th><th>النقاط</th><th>النجوم</th><th>الاختبار</th><th>المحاولات</th><th>الشهادة</th><th>مهارات للمراجعة</th></tr></thead>
      <tbody>${studentRows || `<tr><td colspan="11" class="c muted">لا يوجد طلاب بعد</td></tr>`}</tbody>
    </table>`;

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>${kind === "students" ? "تقرير نتائج الطلاب" : "التقرير العام"} — ${esc(LESSON.title)}</title>
<style>
  @page { size: A4 ${kind === "students" ? "landscape" : "portrait"}; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: "Cairo","Tajawal","Segoe UI",sans-serif; color:#123; margin:0; padding:14px;
         background: linear-gradient(160deg,#f2fbfb 0%,#ffffff 45%,#fff8ef 100%); }
  .sheet { background:#fff; border-radius:22px; padding:18px; box-shadow:0 6px 24px rgba(23,111,112,.12);
           border-top:10px solid #1fadab; }
  header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
           border-bottom:3px solid #1fadab; padding-bottom:12px; margin-bottom:16px; }
  header h1 { margin:0; font-size:24px; color:#0f4c4d; letter-spacing:-.3px; }
  header h1 span { background:linear-gradient(90deg,#1fadab,#1e6fd9); -webkit-background-clip:text; background-clip:text; color:transparent; }
  header p { margin:3px 0; font-size:11.5px; color:#5b7474; }
  .pill { display:inline-block; padding:5px 12px; border-radius:999px; font-size:11px; font-weight:800; margin:2px; }
  .pill.t { background:#e6faf9; color:#0f766e; border:1px solid #99e6e2; }
  .pill.o { background:#fff3e0; color:#b45309; border:1px solid #fcd9a1; }
  h2 { font-size:15px; color:#0f4c4d; margin:20px 0 10px; display:flex; align-items:center; gap:8px; }
  h2::before { content:""; width:10px; height:22px; border-radius:6px;
               background:linear-gradient(180deg,#f7931e,#1fadab); display:inline-block; }
  .cards { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
  .card { border-radius:16px; padding:12px 8px; text-align:center; color:#fff; box-shadow:0 4px 12px rgba(0,0,0,.08); }
  .card span { display:block; font-size:10px; opacity:.92; }
  .card b { display:block; font-size:22px; margin-top:2px; }
  .c1{background:linear-gradient(140deg,#1fadab,#0f766e)} .c2{background:linear-gradient(140deg,#38bdf8,#1e6fd9)}
  .c3{background:linear-gradient(140deg,#fbbf24,#f7931e)} .c4{background:linear-gradient(140deg,#34d399,#059669)}
  .c5{background:linear-gradient(140deg,#818cf8,#4f46e5)} .c6{background:linear-gradient(140deg,#fb7185,#e11d48)}
  table { width:100%; border-collapse:separate; border-spacing:0; font-size:10.5px; border-radius:14px; overflow:hidden;
          box-shadow:0 2px 10px rgba(23,111,112,.08); }
  th { background:linear-gradient(90deg,#1fadab,#178b8b); color:#fff; padding:8px 5px; font-size:10px; border:none; }
  td { padding:6px 5px; background:#fff; border-bottom:1px solid #eaf4f4; vertical-align:middle; }
  tr:nth-child(even) td { background:#f9fdfd; }
  .c { text-align:center; } .b { font-weight:800; color:#0f2a2a; } .mono { font-family:monospace; letter-spacing:1.5px; color:#b45309; font-weight:800; }
  .muted { color:#94a3a3; }
  .bar { position:relative; min-width:88px; height:15px; background:#eef6f6; border-radius:999px; overflow:hidden; }
  .bar i { position:absolute; inset-block:0; inset-inline-start:0; border-radius:999px;
           background:linear-gradient(90deg,#1fadab,#38bdf8); }
  .bar.warn i { background:linear-gradient(90deg,#fbbf24,#f97316); }
  .bar.bad i { background:linear-gradient(90deg,#fb7185,#e11d48); }
  .bar b { position:absolute; inset-inline-end:5px; top:0; font-size:9px; font-weight:900; color:#0f2a2a; }
  .tag { display:inline-block; padding:2px 8px; border-radius:999px; font-size:9px; font-weight:800; }
  .tag.g { background:#dcfce7; color:#047857; } .tag.r { background:#fee2e2; color:#b91c1c; } .tag.n { background:#f1f5f9; color:#64748b; }
  footer { margin-top:18px; padding-top:10px; border-top:2px dashed #cfe9e9; font-size:10px; color:#8aa0a0;
           display:flex; justify-content:space-between; }
  .no-print { margin-bottom:14px; display:flex; gap:8px; }
  button { background:linear-gradient(90deg,#1fadab,#178b8b); color:#fff; border:0; border-radius:12px; padding:11px 20px;
           font-size:14px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:0 4px 12px rgba(23,111,112,.25); }
  @media print { .no-print{display:none} body{background:#fff;padding:0} .sheet{box-shadow:none;border-radius:0;padding:6px} }
</head><body>
  <div class="sheet">
  <div class="no-print"><button onclick="window.print()">🖨️ طباعة / حفظ كـ PDF</button></div>
  <header>
    <div>
      <h1>${kind === "students" ? "تقرير نتائج الطلاب" : "التقرير العام للدرس"}</h1>
      <p>${esc(LESSON.subject)} — ${esc(LESSON.grade)} — الدرس ${LESSON.lessonNumber}: ${esc(LESSON.title)} (ص ${LESSON.pages})</p>
      <p>${esc(LESSON.school)} — المعلم: ${esc(LESSON.teacher)} — الفصل: ${esc(roomName)}</p>
    </div>
    <div style="text-align:left">
      <span class="pill o">تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA-u-ca-gregory")}</span>
      <p style="margin-top:6px">${new Date().toLocaleString("ar-SA")}</p>
    </div>
  </header>
  ${statsGrid}
  <h2>نسبة إكمال كل محطة</h2>
  <table><thead><tr><th>المحطة</th><th>عدد الطلاب</th><th>النسبة</th></tr></thead><tbody>${stationRows}</tbody></table>
  <h2>المهارات التي تحتاج مراجعة</h2>
  <table><thead><tr><th>المهارة</th><th>عدد الطلاب</th><th>النسبة</th></tr></thead><tbody>${skillRows}</tbody></table>
  <h2>الطلاب المتعثرون (${struggling.length})</h2>
  <table><thead><tr><th>الطالب</th><th>الفصل</th><th>الإكمال</th><th>الاختبار</th><th>مهارات للمراجعة</th></tr></thead><tbody>${struggleRows}</tbody></table>
  ${kind === "students" ? studentsTable : ""}
  <footer><span>${esc(LESSON.school)} — ${esc(LESSON.teacher)}</span><span>تم توليد التقرير من منصة درس «شروط الصلاة (1)» التفاعلية</span></footer>
  </div>
  <script>window.addEventListener("load",function(){setTimeout(function(){window.print()},400)});</script>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
