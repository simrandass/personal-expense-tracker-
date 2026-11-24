"use client";

import type { Category, Expense } from "@/lib/expenses";
import { money } from "@/lib/expenses";

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  expenses: Expense[];
  categories: Category[];
  canEdit: boolean;
  onEdit: (x: Expense) => void;
  onDelete: (id: string) => void;
};

export default function ExpenseList({
  month,
  onMonthChange,
  expenses,
  categories,
  canEdit,
  onEdit,
  onDelete,
}: Props) {
  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  const total = expenses.reduce((sum, x) => sum + x.amount_minor, 0);
  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, x) => {
      const name = catName(x.category_id);
      acc[name] = (acc[name] ?? 0) + x.amount_minor;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <section className="card stack">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="muted text-sm">Total spent</div>
          <div className="text-3xl font-semibold">{money(total)}</div>
        </div>
        <input
          className="input"
          style={{ width: "auto" }}
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
        />
      </div>

      {byCategory.length > 0 && (
        <div className="stack" style={{ gap: "0.625rem" }}>
          {byCategory.map(([name, minor]) => (
            <div key={name} className="stack" style={{ gap: "0.25rem" }}>
              <div className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="muted">
                  {money(minor)} · {total ? Math.round((minor / total) * 100) : 0}%
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${total ? (minor / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="muted py-4 text-center">No expenses this month.</p>
      ) : (
        <ul>
          {expenses.map((x) => (
            <li
              key={x.id}
              className="flex items-center justify-between gap-3 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {money(x.amount_minor)}{" "}
                  <span className="muted font-normal">· {catName(x.category_id)}</span>
                </div>
                <div className="muted truncate text-sm">
                  {x.spent_on}
                  {x.note ? ` · ${x.note}` : ""}
                </div>
              </div>
              {canEdit && (
                <div className="flex shrink-0">
                  <button className="link-btn" onClick={() => onEdit(x)}>
                    Edit
                  </button>
                  <button className="link-btn danger" onClick={() => onDelete(x.id)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}