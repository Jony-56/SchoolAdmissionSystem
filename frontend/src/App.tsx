import { useCallback, useEffect, useState } from "react";
import { admissionApi } from "./services/admissionApi";
import type { SchoolClass, AdmissionHold } from "./types";

/* ---------- helpers ---------- */

const ID_PATTERN = /^\d{17}$/;
const display = { fontFamily: "var(--font-display)" } as const;

function getRemainingSeconds(expiresAt: string, now: number) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

const STATUS_STYLE: Record<string, { pill: string; bar: string; label: string }> = {
  HELD: { pill: "bg-amber-50 text-amber-800 ring-amber-200", bar: "bg-amber-500", label: "Payment pending" },
  CONFIRMED: { pill: "bg-emerald-50 text-emerald-800 ring-emerald-200", bar: "bg-emerald-600", label: "Confirmed" },
  EXPIRED: { pill: "bg-rose-50 text-rose-800 ring-rose-200", bar: "bg-rose-500", label: "Expired" },
  CANCELLED: { pill: "bg-slate-100 text-slate-600 ring-slate-200", bar: "bg-slate-400", label: "Cancelled" },
};

/* ---------- small components ---------- */

function SeatBar({ total, confirmed, held }: { total: number; confirmed: number; held: number }) {
  const pct = (n: number) => (total > 0 ? Math.min(100, (n / total) * 100) : 0);
  return (
    <div
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-emerald-100"
      role="img"
      aria-label={`${confirmed} confirmed, ${held} held, out of ${total} seats`}
    >
      <div className="bg-emerald-700 transition-[width] duration-500" style={{ width: `${pct(confirmed)}%` }} />
      <div className="bg-amber-400 transition-[width] duration-500" style={{ width: `${pct(held)}%` }} />
    </div>
  );
}

function Step({ done, active, title, text }: { done: boolean; active: boolean; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${
          done
            ? "bg-emerald-700 text-white ring-emerald-700"
            : active
              ? "bg-white text-emerald-800 ring-emerald-700"
              : "bg-white text-slate-400 ring-slate-300"
        }`}
      >
        {done ? "✓" : ""}
        {!done && <span aria-hidden>●</span>}
      </span>
      <div>
        <p className={`text-sm font-semibold ${done || active ? "text-slate-900" : "text-slate-500"}`}>{title}</p>
        <p className="text-xs text-slate-500">{text}</p>
      </div>
    </li>
  );
}

/* ---------- app ---------- */

function App() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [holds, setHolds] = useState<AdmissionHold[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);

  const loadClasses = useCallback(async () => {
    try {
      const data = await admissionApi.getClasses();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load classes.");
    }
  }, []);

  const loadMyHolds = useCallback(async (id: string) => {
    if (!ID_PATTERN.test(id)) return;
    try {
      const data = await admissionApi.getMyHolds(id);
      setHolds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load applications.");
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      await loadClasses();
      const savedId = localStorage.getItem("studentId");
      if (savedId && ID_PATTERN.test(savedId)) {
        setStudentId(savedId);
        await loadMyHolds(savedId);
      }
      setLoading(false);
    }
    void initialize();
  }, [loadClasses, loadMyHolds]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ID_PATTERN.test(studentId)) return;
    const timer = window.setInterval(() => {
      void loadMyHolds(studentId);
      void loadClasses();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [studentId, loadMyHolds, loadClasses]);

  function validateStudentId() {
    if (!ID_PATTERN.test(studentId)) {
      setError("Birth Registration Number must contain exactly 17 digits.");
      return false;
    }
    localStorage.setItem("studentId", studentId);
    setError("");
    return true;
  }

  async function handleCreateHold(classId: string) {
    if (!validateStudentId()) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await admissionApi.createHold(classId, studentId);
      setMessage("Your admission seat has been reserved.");
      await loadMyHolds(studentId);
      await loadClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reserve seat.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(holdId: string) {
    if (!validateStudentId()) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await admissionApi.confirmHold(holdId, studentId);
      setMessage("Your admission has been confirmed successfully.");
      await loadMyHolds(studentId);
      await loadClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm admission.");
      await loadMyHolds(studentId);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(holdId: string) {
    if (!validateStudentId()) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await admissionApi.cancelHold(holdId, studentId);
      setMessage("Your reservation has been cancelled.");
      await loadMyHolds(studentId);
      await loadClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatus(hold: AdmissionHold) {
    if (hold.status === "HELD" && getRemainingSeconds(hold.expiresAt, now) <= 0) {
      return "EXPIRED";
    }
    return hold.status;
  }

  const idValid = ID_PATTERN.test(studentId);
  const activeApplications = holds.filter((h) => ["HELD", "CONFIRMED"].includes(getStatus(h))).length;
  const hasHeld = holds.some((h) => getStatus(h) === "HELD");
  const hasConfirmed = holds.some((h) => getStatus(h) === "CONFIRMED");
  const availableSeats = classes.reduce((t, c) => t + c.availableSeats, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7F5]">
        <div className="flex items-center gap-3 text-slate-600" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
          <p className="text-sm font-medium">Loading admission portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-slate-800 antialiased">
      {/* ---------- Header ---------- */}
      <header className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-900 text-white"
              aria-hidden
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
                <path d="M7 12v4.5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5V12" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl" style={display}>
                School Admission Portal
              </h1>
              <p className="text-sm text-slate-500">Reserve a seat, then pay the admission fee before the timer ends.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
            Session 2026–2027
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* ---------- Notifications ---------- */}
        <div aria-live="polite" className="space-y-3 empty:hidden">
          {error && (
            <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p>{error}</p>
              <button onClick={() => setError("")} className="rounded px-1 font-bold hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500" aria-label="Dismiss error">
                ✕
              </button>
            </div>
          )}
          {message && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p>{message}</p>
              <button onClick={() => setMessage("")} className="rounded px-1 font-bold hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600" aria-label="Dismiss message">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ---------- Progress + stats ---------- */}
        <section className="mt-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,61,50,0.06)] lg:grid-cols-[1fr_auto] lg:items-center">
          <ol className="grid gap-4 sm:grid-cols-3">
            <Step done={idValid} active={!idValid} title="Enter registration number" text="17-digit birth registration" />
            <Step done={hasHeld || hasConfirmed} active={idValid && !hasHeld && !hasConfirmed} title="Reserve a seat" text="Choose a class and shift" />
            <Step done={hasConfirmed} active={hasHeld} title="Pay admission fee" text="Before the timer runs out" />
          </ol>

          <dl className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 pt-5 text-center lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {[
              ["Classes", classes.length],
              ["Open seats", availableSeats],
              ["Your active", activeApplications],
            ].map(([label, value]) => (
              <div key={label} className="px-4">
                <dd className="text-2xl font-bold tabular-nums text-emerald-950" style={display}>{value}</dd>
                <dt className="mt-0.5 text-xs text-slate-500">{label}</dt>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ================= LEFT ================= */}
          <div className="space-y-8">
            {/* Student information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,61,50,0.06)]">
              <h2 className="text-lg font-bold text-emerald-950" style={display}>Student information</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your number is saved in this browser so your applications reload next time.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="studentId" className="sr-only">Birth Registration Number</label>
                  <input
                    id="studentId"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={17}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
                    placeholder="17-digit Birth Registration Number"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-16 tabular-nums tracking-wide outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                  />
                  <span className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums ${idValid ? "text-emerald-700" : "text-slate-400"}`}>
                    {studentId.length}/17
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (validateStudentId()) {
                      void loadMyHolds(studentId);
                      setMessage("Student applications loaded.");
                    }
                  }}
                  className="rounded-xl bg-emerald-900 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  Load applications
                </button>
              </div>
            </section>

            {/* Class list */}
            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-emerald-950 sm:text-xl" style={display}>Available classes</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-700" />Confirmed</span>
                    <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />Held</span>
                    <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-100 ring-1 ring-emerald-200" />Available</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    void loadClasses();
                    if (idValid) void loadMyHolds(studentId);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
                >
                  Refresh
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="font-semibold text-slate-700">No classes are open right now</p>
                  <p className="mt-1 text-sm text-slate-500">Check back soon or press Refresh.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {classes.map((schoolClass) => {
                    const alreadyApplied = holds.some(
                      (h) => h.classId === schoolClass.id && ["HELD", "CONFIRMED"].includes(getStatus(h))
                    );
                    const full = schoolClass.availableSeats <= 0;
                    const lowSeats = !full && schoolClass.totalSeats > 0 && schoolClass.availableSeats / schoolClass.totalSeats <= 0.1;

                    return (
                      <li
                        key={schoolClass.id}
                        className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,61,50,0.06)] sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="flex items-baseline gap-2 sm:block sm:text-center">
                          <p className="text-4xl font-extrabold leading-none text-emerald-900" style={display}>
                            {schoolClass.classNumber}
                          </p>
                          <p className="text-xs font-medium text-slate-500 sm:mt-1">Class</p>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{schoolClass.name}</h3>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              {schoolClass.shift}
                            </span>
                            {lowSeats && (
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                                Few seats left
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            <SeatBar total={schoolClass.totalSeats} confirmed={schoolClass.confirmedSeats} held={schoolClass.heldSeats} />
                            <p className="mt-2 text-xs text-slate-500">
                              <span className="font-bold tabular-nums text-emerald-800">{schoolClass.availableSeats}</span> available of{" "}
                              <span className="tabular-nums">{schoolClass.totalSeats}</span> seats, {schoolClass.heldSeats} held, {schoolClass.confirmedSeats} confirmed
                            </p>
                          </div>
                        </div>

                        <button
                          disabled={submitting || full || alreadyApplied || !idValid}
                          onClick={() => void handleCreateHold(schoolClass.id)}
                          title={!idValid ? "Enter your 17-digit registration number first" : undefined}
                          className="w-full whitespace-nowrap rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
                        >
                          {alreadyApplied ? "Already applied" : full ? "No seats available" : "Reserve seat"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* ================= RIGHT: applications ================= */}
          <aside className="lg:sticky lg:top-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-emerald-950 sm:text-xl" style={display}>My applications</h2>
              <p className="mt-1 text-sm text-slate-500">Reservation and admission status.</p>
            </div>

            {holds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="font-semibold text-slate-700">No applications yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your registration number, then reserve a seat from the list.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {holds.map((hold) => {
                  const status = getStatus(hold);
                  const remaining = getRemainingSeconds(hold.expiresAt, now);
                  const style = STATUS_STYLE[status] ?? STATUS_STYLE.CANCELLED;
                  const urgent = status === "HELD" && remaining <= 120;

                  return (
                    <li
                      key={hold.holdId}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,61,50,0.06)]"
                    >
                      <span className={`absolute inset-y-0 left-0 w-1.5 ${style.bar}`} aria-hidden />

                      <div className="p-5 pl-6">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-slate-900">{hold.className}</h3>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${style.pill}`}>
                            {style.label}
                          </span>
                        </div>

                        {status === "HELD" && (
                          <div className={`mt-4 rounded-xl px-4 py-3 ${urgent ? "bg-rose-50" : "bg-amber-50"}`}>
                            <p className={`text-xs font-medium ${urgent ? "text-rose-700" : "text-amber-800"}`}>
                              Pay within
                            </p>
                            <p
                              className={`text-3xl font-extrabold tabular-nums ${urgent ? "text-rose-700" : "text-amber-800"}`}
                              style={display}
                              role="timer"
                            >
                              {formatTime(remaining)}
                            </p>
                          </div>
                        )}

                        {status === "CONFIRMED" && hold.confirmedAt && (
                          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Confirmed on {new Date(hold.confirmedAt).toLocaleString()}
                          </p>
                        )}

                        {status === "EXPIRED" && (
                          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            This reservation expired. Reserve a seat again to continue.
                          </p>
                        )}

                        <dl className="mt-4 space-y-1 border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500">
                          <div className="flex justify-between gap-3">
                            <dt>Application ID</dt>
                            <dd className="break-all text-right font-mono text-slate-700">{hold.holdId}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt>Student ID</dt>
                            <dd className="font-mono tabular-nums text-slate-700">{hold.studentId}</dd>
                          </div>
                        </dl>

                        {status === "HELD" && remaining > 0 && (
                          <div className="mt-4 grid gap-2">
                            <button
                              disabled={submitting}
                              onClick={() => void handleConfirm(hold.holdId)}
                              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50"
                            >
                              Pay admission fee
                            </button>
                            <button
                              disabled={submitting}
                              onClick={() => void handleCancel(hold.holdId)}
                              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 disabled:opacity-50"
                            >
                              Cancel reservation
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          School Admission Portal, Online Admission System
        </footer>
      </main>
    </div>
  );
}

export default App;
