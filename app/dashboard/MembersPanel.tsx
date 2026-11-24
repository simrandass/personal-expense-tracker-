"use client";

import { useState } from "react";
import type { Invite, Member } from "@/lib/expenses";

type Props = {
  members: Member[];
  invites: Invite[];
  userId: string;
  origin: string;
  isOwner: boolean;
  canLeave: boolean;
  onRemove: (id: string, label: string) => void;
  onLeave: () => void;
  onInvite: (email: string, role: string) => Promise<boolean>;
  onCancelInvite: (id: string) => void;
  onCopy: (token: string) => void;
};

export default function MembersPanel({
  members,
  invites,
  userId,
  origin,
  isOwner,
  canLeave,
  onRemove,
  onLeave,
  onInvite,
  onCancelInvite,
  onCopy,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  return (
    <section className="card stack">
      <h2 className="card-title" style={{ marginBottom: 0 }}>
        Members
      </h2>

      <ul>
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 break-words">
              {m.email}
              {m.user_id === userId && <span className="muted"> (you)</span>}
              <span className="muted"> · {m.role}</span>
            </span>
            {isOwner && m.role !== "owner" && (
              <button className="link-btn danger" onClick={() => onRemove(m.user_id, m.email)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {canLeave && (
        <button className="link-btn danger self-start" onClick={onLeave}>
          Leave this workspace
        </button>
      )}

      {isOwner && (
        <>
          <form
            className="stack pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (await onInvite(email, role)) setEmail("");
            }}
          >
            <h3 className="text-sm font-medium">Invite someone</h3>
            <input
              className="input"
              type="email"
              placeholder="Their email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="editor">Editor (can add expenses)</option>
                <option value="viewer">Viewer (read only)</option>
              </select>
              <button className="btn btn-primary" type="submit">
                Create invite
              </button>
            </div>
          </form>

          {invites.length > 0 && (
            <div className="stack">
              <h3 className="text-sm font-medium">Pending invites</h3>
              {invites.map((i) => (
                <div
                  key={i.id}
                  className="stack rounded-lg p-3 text-sm"
                  style={{ border: "1px solid var(--border)", gap: "0.5rem" }}
                >
                  <div className="break-words">
                    {i.email} <span className="muted">· {i.role}</span>
                  </div>
                  <input
                    readOnly
                    className="input"
                    style={{ minHeight: "2.25rem", fontSize: "0.75rem" }}
                    value={`${origin}/invite/${i.token}`}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <div className="flex">
                    <button className="link-btn" onClick={() => onCopy(i.token)}>
                      Copy link
                    </button>
                    <button className="link-btn danger" onClick={() => onCancelInvite(i.id)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}