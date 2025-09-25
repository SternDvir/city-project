"// src/app/cities/[cityName]/page.tsx";
import * as React from "react";

interface CityPageProps {
  params: {
    cityName: string;
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { cityName } = await params;
  return (
    <main className="bg-slate-900 text-white min-h-screen p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-center">
          Welcome to {cityName}!
        </h1>
        <p className="text-lg text-slate-300 text-center">
          This is a dynamic page for {cityName}. More details will be added
          soon.
        </p>
      </div>
    </main>
  );
}
