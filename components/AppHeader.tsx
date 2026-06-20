"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/candidates", label: "Candidates" },
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/skill", label: "Skill" },
  { href: "/themes", label: "Themes" },
  { href: "/profile", label: "Profile" },
];

interface AppHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, actions }: AppHeaderProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 shrink-0">{title}</h1>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {actions && <div className="ml-2 pl-2 border-l border-gray-200">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
