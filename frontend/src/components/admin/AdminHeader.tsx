
interface AdminHeaderProps {
  title: string;
  description: string;
}

export default function AdminHeader({
  title,
  description,
}: AdminHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">School Admin</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
      </div>
    </header>
  );
}
