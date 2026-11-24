"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function go() {
      const { data: { user } } = await supabase.auth.getUser();
      router.replace(user ? "/dashboard" : "/login");
    }
    go();
  }, [router]);

  return (
    <main className="page" style={{ paddingTop: "4rem" }}>
      <p className="muted">Loading...</p>
    </main>
  );
}
