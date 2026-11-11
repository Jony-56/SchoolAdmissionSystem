
import { useCallback, useEffect, useState } from "react";
import { admissionApi } from "../../services/admissionApi";
import type { SchoolClass } from "../../types";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

interface ClassFormData {
  name: string;
  classNumber: number;
  shift: "Morning" | "Day";
  totalSeats: number;
}

const initialForm: ClassFormData = {
  name: "",
  classNumber: 1,
  shift: "Morning",
  totalSeats: 50,
};

export default function ClassManagement() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [form, setForm] = useState<ClassFormData>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadClasses = useCallback(async () => {
    try {
      setError("");
      const data = await admissionApi.getClasses();
      setClasses(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load classes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  function updateForm<K extends keyof ClassFormData>(
    key: K,
    value: ClassFormData[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleCreateClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Please enter a class name.");
      return;
    }

    if (
      !Number.isInteger(form.classNumber) ||
      form.classNumber < 1 ||
      form.classNumber > 12
    ) {
      setError("Class number must be between 1 and 12.");
      return;
    }

    if (!Number.isInteger(form.totalSeats) || form.totalSeats < 1) {
      setError("Total seats must be at least 1.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          classNumber: form.classNumber,
          shift: form.shift,
          totalSeats: form.totalSeats,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.title ||
            result?.error ||
            `Failed to create class. HTTP ${response.status}`
        );
      }

      setMessage("Class created successfully.");
      setForm(initialForm);

      await loadClasses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create class."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-900">
          Class Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create school classes and monitor seat availability.
        </p>
      </header>

      <main className="space-y-6 p-6">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {message}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Create New Class
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter class information and available seat capacity.
          </p>

          <form
            onSubmit={handleCreateClass}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Class Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Example: Class 6 Morning"
                maxLength={100}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Class Number
              </label>
              <select
                value={form.classNumber}
                onChange={(e) =>
                  updateForm("classNumber", Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((number) => (
                  <option key={number} value={number}>
                    Class {number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Shift
              </label>
              <select
                value={form.shift}
                onChange={(e) =>
                  updateForm("shift", e.target.value as "Morning" | "Day")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="Morning">Morning</option>
                <option value="Day">Day</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total Seats
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={form.totalSeats}
                onChange={(e) =>
                  updateForm("totalSeats", Number(e.target.value))
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Class"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="font-bold text-slate-900">All Classes</h2>
              <p className="mt-1 text-sm text-slate-500">
                {classes.length} classes found
              </p>
            </div>

            <button
              onClick={() => void loadClasses()}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-8 text-center text-slate-500">
              Loading classes...
            </p>
          ) : classes.length === 0 ? (
            <p className="p-8 text-center text-slate-500">
              No classes found. Create your first class above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Shift</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Held</th>
                    <th className="px-5 py-4">Confirmed</th>
                    <th className="px-5 py-4">Available</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {classes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-5 py-4">{item.shift}</td>
                      <td className="px-5 py-4">{item.totalSeats}</td>
                      <td className="px-5 py-4 text-amber-700">
                        {item.heldSeats}
                      </td>
                      <td className="px-5 py-4 text-emerald-700">
                        {item.confirmedSeats}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {item.availableSeats}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
