"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function nextPath() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  }

  async function signIn() {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMessage(error.message);
    router.push(nextPath());
  }

  async function signUp() {
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setMessage(error.message);
    if (data.session) router.push(nextPath());
    else setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <main className="page" style={{ maxWidth: "24rem", paddingTop: "4rem" }}>
      <div>
        <h1 className="text-2xl font-semibold">Expense Tracker</h1>
        <p className="muted text-sm">Sign in or create an account.</p>
      </div>
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          signIn();
        }}
      >
        <input
          className="input"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password (min 6 characters)"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="row">
          <button className="btn btn-primary flex-1" type="submit">
            Sign in
          </button>
          <button className="btn flex-1" type="button" onClick={signUp}>
            Sign up
          </button>
        </div>
        {message && <p className="error">{message}</p>}
      </form>
    </main>
  );
}