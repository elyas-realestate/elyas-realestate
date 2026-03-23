"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">إلياس الدخيل</h1>
          <p className="text-gray-400">لوحة التحكم العقارية</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center">تسجيل الدخول</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="example@email.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition disabled:opacity-50">
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}