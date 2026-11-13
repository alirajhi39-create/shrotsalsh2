"use client";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "Cairo, system-ui, sans-serif", background: "#f2fbfb", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 520, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.08)" }}>
            <div style={{ fontSize: 56 }}>⚠️</div>
            <h1 style={{ color: "#0f4c4d", fontSize: 24, margin: "12px 0 8px" }}>حدث خطأ غير متوقع</h1>
            <p style={{ color: "#475569", fontSize: 15 }}>تعذّر تحميل الصفحة. أعد المحاولة أو افتح الموقع في تبويب مستقل.</p>
            {error?.digest && <p style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{error.digest}</p>}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button onClick={reset} style={{ background: "#178b8b", color: "#fff", border: 0, borderRadius: 16, padding: "12px 22px", fontWeight: 800, cursor: "pointer" }}>
                🔁 إعادة المحاولة
              </button>
              <a href="/" style={{ background: "#f1f5f9", color: "#334155", borderRadius: 16, padding: "12px 22px", fontWeight: 800, textDecoration: "none" }}>
                🏠 الرئيسية
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
