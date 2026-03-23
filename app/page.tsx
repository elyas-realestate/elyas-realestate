import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">إلياس الدخيل</h1>
        <p className="text-gray-400 text-xl">منصة إدارة العقارات</p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition"
          >
            لوحة التحكم
          </Link>
          <Link
            href="/properties"
            className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-lg font-medium transition"
          >
            العقارات
          </Link>
        </div>
      </div>
    </div>
  );
}