"use client";

import { useState } from "react";
import type { Workspace } from "@/lib/expenses";

type Props = {
  workspaces: Workspace[];
  workspaceId: string;
  current?: Workspace;
  isOwner: boolean;
  onSwitch: (id: string) => void;
  onRename: (name: string) => void;
  onCreate: (name: string) => Promise<boolean>;
};

export default function WorkspaceBar({
  workspaces,
  workspaceId,
  current,
  isOwner,
  onSwitch,
  onRename,
  onCreate,
}: Props) {
  const [newName, setNewName] = useState("");

  return (
    <section className="card stack">
      <div className="stack" style={{ gap: "0.375rem" }}>
        <label className="muted text-sm" htmlFor="workspace">
          Workspace
        </label>
        <select
          id="workspace"
          className="input"
          value={workspaceId}
          onChange={(e) => onSwitch(e.target.value)}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.role})
            </option>
          ))}
        </select>
      </div>

      <details>
        <summary className="muted cursor-pointer text-sm">Manage workspaces</summary>
        <div className="stack mt-3">
          {isOwner && (
            <form
              key={workspaceId}
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
                if (name) onRename(name);
              }}
            >
              <input
                name="name"
                className="input"
                defaultValue={current?.name}
                placeholder="Workspace name"
              />
              <button className="btn" type="submit">
                Rename
              </button>
            </form>
          )}
          <form
            className="row"
            onSubmit={async (e) => {
              e.preventDefault();
              const name = newName.trim();
              if (!name) return;
              if (await onCreate(name)) setNewName("");
            }}
          >
            <input
              className="input"
              placeholder="New workspace (e.g. Trip to Rome)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="btn" type="submit">
              Create
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}