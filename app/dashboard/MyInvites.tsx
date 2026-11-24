"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MyInvite = {
  token: string;
  workspace_name: string;
  role: string;
  invited_by_email: string;
  expires_at: string;
};

export default function MyInvites() {
  const [invites, setInvites] = useState<MyInvite[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("get_my_invites");
      if (error) setError(error.message);
      else setInvites(data ?? []);
    }
    load();
  }, []);

  async function accept(token: string) {
    setBusy(token);
    setError("");
    const { data: workspaceId, error } = await supabase.rpc("accept_invite", {
      invite_token: token,
    });
    if (error) {
      setBusy("");
      return setError(error.message);
    }
    window.location.href = `/dashboard?ws=${workspaceId}`;
  }

  async function decline(token: string) {
    if (!window.confirm("Decline this invite?")) return;
    setBusy(token);
    setError("");
    const { error } = await supabase.rpc("decline_invite", { invite_token: token });
    setBusy("");
    if (error) return setError(error.message);
    setInvites((prev) => prev.filter((i) => i.token !== token));
  }

  if (invites.length === 0 && !error) return null;

  return (
    <section className="card stack" style={{ borderColor: "var(--accent)" }}>
      <h2 className="card-title" style={{ marginBottom: 0 }}>
        Your invitations
      </h2>
      {error && <p className="error">{error}</p>}
      {invites.map((i) => (
        <div key={i.token} className="stack text-sm" style={{ gap: "0.5rem" }}>
          <div>
            <strong>{i.workspace_name}</strong>{" "}
            <span className="muted">· join as {i.role}</span>
          </div>
          <div className="muted break-words">
            From {i.invited_by_email} · expires {i.expires_at.slice(0, 10)}
          </div>
          <div className="row">
            <button
              className="btn btn-primary btn-sm"
              disabled={busy === i.token}
              onClick={() => accept(i.token)}
            >
              Accept
            </button>
            <button
              className="btn btn-sm"
              disabled={busy === i.token}
              onClick={() => decline(i.token)}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}