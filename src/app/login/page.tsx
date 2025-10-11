// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);

  const { user, login, isAuthenticated, loading } = useAuthStore();
  const router = useRouter();


  useEffect(() => {
    if (hasAttemptedLogin && !loading) {
      if (isAuthenticated && user?.role==="admin") {
        console.log("Admin User Logged In");
        router.push("/dashboard");
      }else if(isAuthenticated && user?.role!=="admin"){
        console.log("B2B User Logged In");
        router.push("/b2b")
      } else {
        setError("Invalid email or password. Please try again.");
      }
      setHasAttemptedLogin(false);
    }
  }, [loading, isAuthenticated, hasAttemptedLogin, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setHasAttemptedLogin(true);
    await login(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center flex flex-col items-center">
          <img src="/logo.gif" alt="" className="w-3/4 h-full rounded-lg" />
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="mt-2 text-sm text-gray-500">To Access Home</p>
        </div>



        <form onSubmit={handleLogin} className="space-y-5 mt-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email Address"
              className="w-full rounded-lg border border-gray-200 p-3 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full rounded-lg border border-gray-200 p-3 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}


          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-center font-medium text-white hover:cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
            {!loading && <ArrowRight size={20} />}
          </button>

          <p className="text-center text-xs text-gray-500">
            By signing up you are agreeing to <span className="font-medium text-blue-600 hover:underline hover:cursor-pointer">Terms & Conditions</span>
          </p>
        </form>
      </div>
    </div>
  );
}