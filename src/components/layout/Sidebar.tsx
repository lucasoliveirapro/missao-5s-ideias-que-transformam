import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Gauge,
  Medal,
  Shield,
  Table2,
  Upload,
  Users
} from "lucide-react";

const navItems = [
  { href: "/ranking/top3", label: "Top 3", icon: Medal },
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/upload", label: "Importar SS", icon: Upload },
  { href: "/condutores", label: "Condutores", icon: Users },
  { href: "/cartoes", label: "Cartoes", icon: Table2 },
  { href: "/ranking/geral", label: "Ranking geral", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 text-white lg:block">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-emerald-500 text-slate-950">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Ranking AM</p>
            <p className="text-xs text-slate-300">SS Z2/Z3/Z4</p>
          </div>
        </div>
      </div>
      <nav className="grid gap-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
              href={item.href}
              key={item.href}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
