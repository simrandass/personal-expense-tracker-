"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState("Checking your invite...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function accept() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push(`/login?next=/invite/${token}`);

      const { data: workspaceId, error } = await supabase.rpc("accept_invite", {
        invite_token: token,
      });
      if (error) {
        setFailed(true);
        return setStatus(error.message);
      }
      router.push(`/dashboard?ws=${workspaceId}`);
    }
    accept();
  }, [token, router]);

  return (
    <>
      <p className={failed ? "error" : "muted"}>{status}</p>
      {failed && (
        <button className="btn" onClick={() => router.push("/dashboard")}>
          Go to my dashboard
        </button>
      )}
    </>
  );
}

export default function InvitePage() {
  return (
    <main className="page" style={{ maxWidth: "24rem", paddingTop: "4rem" }}>
      <h1 className="text-2xl font-semibold">Workspace invite</h1>
      <div className="card stack">
        <Suspense fallback={<p className="muted">Loading...</p>}>
          <AcceptInvite />
        </Suspense>
      </div>
    </main>
  );
}