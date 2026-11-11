
import type { SchoolClass } from "../../types";

import AdminHeader from "../../components/admin/AdminHeader";
import StatCard from "../../components/admin/StatCard";

type AdminDashboardProps = {
  classes: SchoolClass[];
  loading: boolean;
  error: string;
  onManageClasses: () => void;
};

export default function AdminDashboard({
  classes,
  loading,
  error,
  onManageClasses,
}: AdminDashboardProps) {

  const totalSeats = classes.reduce(
    (sum, item) => sum + item.totalSeats,
    0
  );

  const heldSeats = classes.reduce(
    (sum, item) => sum + item.heldSeats,
    0
  );

  const confirmedSeats = classes.reduce(
    (sum, item) => sum + item.confirmedSeats,
    0
  );

  const availableSeats = classes.reduce(
    (sum, item) => sum + item.availableSeats,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader
        title="Dashboard Overview"
        description="Monitor school classes and admission seat availability."
      />

      <div className="flex justify-end px-6 pt-6">
        <button
          type="button"
          onClick={onManageClasses}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Manage Classes
        </button>
      </div>

      <main className="space-y-6 p-6 pt-0">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-slate-500">
            Loading dashboard...
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Admission Statistics
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Classes"
                  value={classes.length}
                  description="Currently listed classes"
                  icon="▦"
                />

                <StatCard
                  title="Total Seats"
                  value={totalSeats}
                  description="Total admission capacity"
                  icon="▤"
                />

                <StatCard
                  title="Held Seats"
                  value={heldSeats}
                  description="Seats temporarily reserved"
                  icon="◷"
                />

                <StatCard
                  title="Confirmed Seats"
                  value={confirmedSeats}
                  description="Successfully confirmed seats"
                  icon="✓"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Seat Availability
                  </h2>
                  <p className="text-sm text-slate-500">
                    Current seat allocation across all classes.
                  </p>
                </div>

                <span className="text-2xl font-bold text-emerald-700">
                  {availableSeats} Available
                </span>
              </div>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full">
                  <div
                    className="bg-emerald-600 transition-all"
                    style={{
                      width: `${
                        totalSeats
                          ? (confirmedSeats / totalSeats) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="bg-amber-400 transition-all"
                    style={{
                      width: `${
                        totalSeats
                          ? (heldSeats / totalSeats) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-600">
                <span>🟢 Confirmed: {confirmedSeats}</span>
                <span>🟡 Held: {heldSeats}</span>
                <span>⚪ Available: {availableSeats}</span>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-bold text-slate-900">
                  Class Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seat allocation by class and shift.
                </p>
              </div>

              {classes.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  No classes found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Class</th>
                        <th className="px-5 py-4">Shift</th>
                        <th className="px-5 py-4">Total Seats</th>
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
          </>
        )}
      </main>
    </div>
  );
}
