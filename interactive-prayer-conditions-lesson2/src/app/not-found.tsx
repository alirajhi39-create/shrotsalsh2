import Link from "next/link";

export default function NotFound() {
  return (
    <main className="pattern-bg grid min-h-screen place-items-center p-4" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl shadow-turq-900/10">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-black text-turq-900">الصفحة غير موجودة</h1>
        <p className="mt-2 text-slate-600">قد يكون الرابط غير صحيح أو أن الشهادة أُلغيت.</p>
        <Link href="/" className="mt-6 inline-block rounded-2xl bg-turq-600 px-6 py-3 font-black text-white shadow-lg hover:bg-turq-700">
          🏠 العودة للصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
