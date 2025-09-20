// src/app/components/Header.tsx

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-slate-800 border-b border-slate-700 text-white p-4">
      <nav className="max-w-4xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-sky-500 hover:text-sky-400"
        >
          CityPages
        </Link>
        <ul className="flex space-x-6">
          <li>
            <Link href="/" className="hover:text-sky-400 transition-colors">
              Home
            </Link>
          </li>
          <li>
            {/* This link will initially lead to a 404 page, which is expected. */}
            <Link
              href="/about"
              className="hover:text-sky-400 transition-colors"
            >
              About
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
