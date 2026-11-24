"use client";

import type { Category, FormValues } from "@/lib/expenses";

type Props = {
  editing: boolean;
  value: FormValues;
  categories: Category[];
  onChange: (patch: Partial<FormValues>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export default function ExpenseForm({
  editing,
  value,
  categories,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="card stack">
      <h2 className="card-title" style={{ marginBottom: 0 }}>
        {editing ? "Edit expense" : "Add expense"}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="Amount (e.g. 12.50)"
          inputMode="decimal"
          value={value.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
        />
        <input
          className="input"
          type="date"
          value={value.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>

      <select
        className="input"
        value={value.categoryId}
        onChange={(e) => onChange({ categoryId: e.target.value })}
      >
        <option value="">Uncategorized</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        className="input"
        placeholder="Note (optional)"
        value={value.note}
        onChange={(e) => onChange({ note: e.target.value })}
      />

      <div className="row">
        <button className="btn btn-primary" type="submit">
          {editing ? "Save" : "Add expense"}
        </button>
        {editing && (
          <button className="btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}