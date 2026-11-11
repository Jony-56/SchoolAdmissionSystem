
import { useState, type FormEvent } from "react";
import { admissionApi } from "../../services/admissionApi";
import type { AdmissionHold } from "../../types";

const ID_PATTERN = /^\d{17}$/;

const statusStyles: Record<string, string> = {
  HELD: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-slate-100 text-slate-700",
};

export default function AdmissionManagement() {
  const [studentId, setStudentId] = useState("");
  const [applications, setApplications] = useState<AdmissionHold[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setApplications([]);
    setSearched(false);

    if (!ID_PATTERN.test(studentId)) {
      setError("Enter a valid 17-digit Birth Registration Number.");
      return;
    }

    setLoading(true);

    try {
      const data = await admissionApi.getMyHolds(studentId);
      setApplications(data);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admission applications."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-900">
          Admission Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Look up admission applications using a student's registration number.
        </p>
      </header>

      <main className="space-y-6 p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Search Student Applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the student's 17-digit Birth Registration Number.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={17}
              value={studentId}
              onChange={(e) =>
                setStudentId(e.target.value.replace(/\D/g, ""))
              }
              placeholder="17-digit Birth Registration Number"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search Applications"}
            </button>
          </form>

          <p className="mt-2 text-xs text-slate-400">
            {studentId.length}/17 digits
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {searched && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Application Results
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Student ID: {studentId}
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                {applications.length} Application(s)
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No applications found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  No admission applications were returned for this Student ID.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Class</th>
                      <th className="px-5 py-4">Application ID</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Expires At</th>
                      <th className="px-5 py-4">Confirmed At</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {applications.map((application) => (
                      <tr
                        key={application.holdId}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {application.className}
                        </td>

                        <td className="max-w-48 break-all px-5 py-4 font-mono text-xs text-slate-500">
                          {application.holdId}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              statusStyles[application.status] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {application.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(application.expiresAt)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(application.confirmedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        
      </main>
    </div>
  );
}
