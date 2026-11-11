
type AdminPage = "dashboard" | "classes" | "admissions";

interface AdminSidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onBackToStudent: () => void;
}

const menuItems: { id: AdminPage; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "classes", label: "Class Management", icon: "▤" },
  { id: "admissions", label: "Admission Applications", icon: "♙" },
];

export default function AdminSidebar({
  activePage,
  onNavigate,
  onBackToStudent,
}: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-slate-950 text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-xl">
            S
          </div>
          <div>
            <h1 className="font-bold">School Admin</h1>
            <p className="text-xs text-slate-400">Admission Management</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                activePage === item.id
                  ? "bg-emerald-700 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-4">
        <button
          onClick={onBackToStudent}
          className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to Student Portal
        </button>
      </div>
    </aside>
  );
}
