"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Category, Expense, FormValues, Invite, Member, Workspace } from "@/lib/expenses";
import { money, monthRange, todayStr } from "@/lib/expenses";
import MyInvites from "./MyInvites";
import WorkspaceBar from "./WorkspaceBar";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import MembersPanel from "./MembersPanel";

const COLUMNS = "id, amount_minor, spent_on, note, category_id";

function savedWorkspace() {
  try {
    return localStorage.getItem("workspaceId");
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [origin, setOrigin] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormValues>({ amount: "", date: "", categoryId: "", note: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const current = workspaces.find((w) => w.id === workspaceId);
  const isOwner = current?.role === "owner";
  const canEdit = current?.role === "owner" || current?.role === "editor";
  const patchForm = (patch: Partial<FormValues>) => setForm((f) => ({ ...f, ...patch }));

  // 1. load user and the workspaces they belong to
  useEffect(() => {
    async function init() {
      const t = todayStr();
      setMonth(t.slice(0, 7));
      setForm((f) => ({ ...f, date: t }));
      setOrigin(window.location.origin);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setEmail(user.email ?? "");
      setUserId(user.id);

      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id);
      const { data: wsRows } = await supabase
        .from("workspaces")
        .select("id, name")
        .order("created_at");

      const roleOf = new Map(
        (memberships ?? []).map((m: { workspace_id: string; role: string }) => [m.workspace_id, m.role])
      );
      const list: Workspace[] = (wsRows ?? []).map((w: { id: string; name: string }) => ({
        id: w.id,
        name: w.name,
        role: roleOf.get(w.id) ?? "viewer",
      }));
      setWorkspaces(list);

      const wanted = new URLSearchParams(window.location.search).get("ws") ?? savedWorkspace();
      const pick = list.find((w) => w.id === wanted) ?? list[0];
      if (pick) setWorkspaceId(pick.id);
    }
    init();
  }, [router]);

  // 2. categories and members when the workspace changes
  useEffect(() => {
    if (!workspaceId) return;
    async function loadWorkspace() {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("workspace_id", workspaceId)
        .order("name");
      setCategories(cats ?? []);
      patchForm({ categoryId: cats && cats.length ? cats[0].id : "" });

      const { data: mem } = await supabase.rpc("get_workspace_members", { ws: workspaceId });
      setMembers(mem ?? []);
    }
    loadWorkspace();
  }, [workspaceId]);

  // 3. owners also load pending invites
  useEffect(() => {
    if (!workspaceId || !isOwner) {
      setInvites([]);
      return;
    }
    async function loadInvites() {
      const { data } = await supabase
        .from("invites")
        .select("id, email, role, token, expires_at")
        .eq("workspace_id", workspaceId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      setInvites(data ?? []);
    }
    loadInvites();
  }, [workspaceId, isOwner]);

  // 4. expenses when the month or workspace changes
  useEffect(() => {
    if (!month || !workspaceId) return;
    async function loadExpenses() {
      const { start, end } = monthRange(month);
      const { data, error } = await supabase
        .from("expenses")
        .select(COLUMNS)
        .eq("workspace_id", workspaceId)
        .gte("spent_on", start)
        .lt("spent_on", end)
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setExpenses(data ?? []);
    }
    loadExpenses();
  }, [month, workspaceId]);

  function resetForm() {
    setEditingId(null);
    patchForm({ amount: "", note: "", date: todayStr() });
  }

  function switchWorkspace(id: string) {
    setExpenses([]);
    setError("");
    resetForm();
    setWorkspaceId(id);
    try {
      localStorage.setItem("workspaceId", id);
    } catch {}
  }

  function startEdit(x: Expense) {
    setError("");
    setEditingId(x.id);
    setForm({
      amount: money(x.amount_minor),
      date: x.spent_on,
      categoryId: x.category_id ?? "",
      note: x.note ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = parseFloat(form.amount.replace(",", "."));
    if (!isFinite(value) || value <= 0) return setError("Enter an amount greater than 0.");
    if (!workspaceId) return setError("No workspace found.");

    const fields = {
      amount_minor: Math.round(value * 100),
      spent_on: form.date,
      category_id: form.categoryId || null,
      note: form.note.trim() || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("expenses")
        .update(fields)
        .eq("id", editingId)
        .select(COLUMNS)
        .single();
      if (error) return setError(error.message);
      setExpenses((prev) => {
        const without = prev.filter((x) => x.id !== editingId);
        return data.spent_on.startsWith(month)
          ? [data, ...without].sort((a, b) => b.spent_on.localeCompare(a.spent_on))
          : without;
      });
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({ workspace_id: workspaceId, ...fields })
      .select(COLUMNS)
      .single();
    if (error) return setError(error.message);
    if (data.spent_on.startsWith(month)) {
      setExpenses((prev) =>
        [data, ...prev].sort((a, b) => b.spent_on.localeCompare(a.spent_on))
      );
    }
    patchForm({ amount: "", note: "" });
  }

  async function deleteExpense(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return setError(error.message);
    setExpenses((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) resetForm();
  }

  async function createWorkspace(name: string) {
    setError("");
    const { data: id, error } = await supabase.rpc("create_workspace", { ws_name: name });
    if (error) {
      setError(error.message);
      return false;
    }
    setWorkspaces((prev) => [...prev, { id, name, role: "owner" }]);
    switchWorkspace(id);
    return true;
  }

  async function renameWorkspace(name: string) {
    const { error } = await supabase.from("workspaces").update({ name }).eq("id", workspaceId);
    if (error) return setError(error.message);
    setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? { ...w, name } : w)));
  }

  async function createInvite(inviteEmail: string, role: string) {
    setError("");
    const addr = inviteEmail.trim().toLowerCase();
    if (!addr.includes("@")) {
      setError("Enter a valid email address.");
      return false;
    }
    const { data, error } = await supabase
      .from("invites")
      .insert({ workspace_id: workspaceId, email: addr, role })
      .select("id, email, role, token, expires_at")
      .single();
    if (error) {
      setError(error.message);
      return false;
    }
    setInvites((prev) => [data, ...prev]);
    return true;
  }

  async function cancelInvite(id: string) {
    const { error } = await supabase.from("invites").delete().eq("id", id);
    if (error) return setError(error.message);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(`${origin}/invite/${token}`);
    } catch {
      setError("Couldn't copy automatically. Select the link and copy it by hand.");
    }
  }

  async function removeMember(targetId: string, label: string) {
    if (!window.confirm(`Remove ${label} from this workspace?`)) return;
    setError("");
    const { error } = await supabase.rpc("remove_member", { ws: workspaceId, target: targetId });
    if (error) return setError(error.message);
    setMembers((prev) => prev.filter((m) => m.user_id !== targetId));
  }

  async function leaveWorkspace() {
    if (!window.confirm(`Leave "${current?.name}"? You'll need a new invite to rejoin.`)) return;
    setError("");
    const { error } = await supabase.rpc("remove_member", { ws: workspaceId, target: userId });
    if (error) return setError(error.message);
    const remaining = workspaces.filter((w) => w.id !== workspaceId);
    setWorkspaces(remaining);
    if (remaining[0]) switchWorkspace(remaining[0].id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="page">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="muted truncate text-sm">{email}</p>
        </div>
        <button className="btn btn-sm" onClick={signOut}>
          Sign out
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <MyInvites />

      <WorkspaceBar
        workspaces={workspaces}
        workspaceId={workspaceId}
        current={current}
        isOwner={isOwner}
        onSwitch={switchWorkspace}
        onRename={renameWorkspace}
        onCreate={createWorkspace}
      />

      {canEdit && (
        <ExpenseForm
          editing={editingId !== null}
          value={form}
          categories={categories}
          onChange={patchForm}
          onSubmit={saveExpense}
          onCancel={resetForm}
        />
      )}

      <ExpenseList
        month={month}
        onMonthChange={setMonth}
        expenses={expenses}
        categories={categories}
        canEdit={canEdit}
        onEdit={startEdit}
        onDelete={deleteExpense}
      />

      <MembersPanel
        members={members}
        invites={invites}
        userId={userId}
        origin={origin}
        isOwner={isOwner}
        canLeave={!isOwner && !!current}
        onRemove={removeMember}
        onLeave={leaveWorkspace}
        onInvite={createInvite}
        onCancelInvite={cancelInvite}
        onCopy={copyLink}
      />
    </main>
  );
}