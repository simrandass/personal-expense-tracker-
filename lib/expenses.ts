export type Workspace = { id: string; name: string; role: string };
export type Category = { id: string; name: string };
export type Expense = {
  id: string;
  amount_minor: number;
  spent_on: string;
  note: string | null;
  category_id: string | null;
};
export type Member = { user_id: string; email: string; role: string };
export type Invite = { id: string; email: string; role: string; token: string; expires_at: string };
export type FormValues = { amount: string; date: string; categoryId: string; note: string };

export const money = (minor: number) => (minor / 100).toFixed(2);
export const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(y, m, 1);
  const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  return { start: `${month}-01`, end };
}