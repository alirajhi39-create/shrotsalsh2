"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="pattern-bg grid min-h-screen place-items-center p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl shadow-turq-900/10">
        <div className="text-6xl">⚠️</div>
        <h1 className="mt-4 text-2xl font-black text-turq-900">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-slate-600">
          تعذّر تحميل الصفحة. أعد المحاولة، وإن تكرر الأمر افتح الموقع في تبويب مستقل أو تواصل مع المعلم.
        </p>
        {error?.digest && <p className="mt-3 font-mono text-xs text-slate-400">رمز الخطأ: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="rounded-2xl bg-turq-600 px-6 py-3 font-black text-white shadow-lg hover:bg-turq-700">
            🔁 إعادة المحاولة
          </button>
          <a href="/" className="rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-700 hover:bg-slate-200">
            🏠 الصفحة الرئيسية
          </a>
        </div>
      </div>
    </main>
  );
}
