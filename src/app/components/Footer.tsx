// src/app/components/Footer.tsx

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-800 border-t border-slate-700 text-slate-400 text-center p-4 mt-auto">
      <p>&copy; {currentYear} City Pages App. All Rights Reserved.</p>
    </footer>
  );
}
