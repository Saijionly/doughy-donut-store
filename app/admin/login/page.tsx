"use client";

import Link from "next/link";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      console.log("LOGIN: starting...");

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      console.log("LOGIN RESPONSE:", {
        user: data.user,
        session: data.session,
        error,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error(
          "Login succeeded but no user was returned."
        );
      }

      console.log(
        "LOGIN SUCCESS:",
        data.user.email
      );

      window.location.assign("/admin");
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="w-full max-w-md">

          {/* Brand */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#fff8f5] text-4xl shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
              🍩
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Welcome Back
            </h1>

            <p className="mt-3 text-sm text-[#806e6e]">
              Sign in to manage your Doughy store.
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="mt-8 rounded-[32px] bg-[#fff8f5] p-7 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-9"
          >

            {/* Error */}
            {errorMessage && (
              <div className="mb-6 rounded-[18px] bg-[#fce4e7] px-5 py-4 text-sm font-semibold text-[#a84f61]">
                <p className="font-black">
                  Login failed
                </p>

                <p className="mt-1 break-words">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="text-sm font-bold"
              >
                Email Address
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage("");
                }}
                placeholder="admin@example.com"
                autoComplete="email"
                disabled={loading}
                className="mt-3 w-full rounded-2xl bg-[#f9ebe2] px-5 py-4 text-sm outline-none shadow-[inset_4px_4px_10px_#d8c5c0,inset_-4px_-4px_10px_#ffffff] transition focus:ring-2 focus:ring-[#e8a0ad] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="mt-6">
              <label
                htmlFor="admin-password"
                className="text-sm font-bold"
              >
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="mt-3 w-full rounded-2xl bg-[#f9ebe2] px-5 py-4 text-sm outline-none shadow-[inset_4px_4px_10px_#d8c5c0,inset_-4px_-4px_10px_#ffffff] transition focus:ring-2 focus:ring-[#e8a0ad] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-full bg-[#e8a0ad] px-7 py-4 text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

            {/* Back */}
            <Link
              href="/"
              className="mt-6 block text-center text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
            >
              ← Back to Store
            </Link>

          </form>

          <p className="mt-6 text-center text-xs text-[#a58f8f]">
            Doughy Admin Panel
          </p>

        </div>
      </div>
    </main>
  );
}