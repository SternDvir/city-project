import AppContent from "./components/AppContent";

export default function HomePage() {
  return (
    <main className="bg-slate-900 text-white min-h-screen p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to the City List App
        </h1>
        <AppContent />
      </div>
    </main>
  );
}
