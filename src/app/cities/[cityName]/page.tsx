// src/app/cities/[cityName]/page.tsx
import { connectToDatabase } from "@/lib/mongodb";
import City from "@/models/City";
import { ICity } from "@/models/City";
import { CityContent } from "@/lib/ai/city.schema";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ErrorDisplay from "@/app/components/ErrorDisplay";
import Link from "next/link";

interface CityPageProps {
  params: {
    cityName: string;
  };
}

// Helper function to render a list of items
const renderList = (title: string, items: string[] | undefined) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-semibold mb-3 text-sky-400">{title}</h3>
      <ul className="list-disc list-inside bg-slate-800/50 p-4 rounded-lg">
        {items.map((item, index) => (
          <li key={index} className="mb-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to render news or events
const renderNewsOrEvents = (
  title: string,
  items: { title?: string; name?: string; url?: string; date?: string }[]
) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-semibold mb-3 text-sky-400">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition-colors"
          >
            <p className="font-bold">{item.title || item.name}</p>
            {item.date && (
              <p className="text-sm text-slate-400">
                {new Date(item.date).toLocaleDateString()}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default async function CityPage({ params }: CityPageProps) {
  await connectToDatabase();
  // Decode the city name from the URL
  const props = await params;
  const cityName = decodeURIComponent(props.cityName);
  const city: ICity | null = await City.findOne({ name: cityName });

  if (!city) {
    return (
      <main className="bg-slate-900 text-white min-h-screen p-8 font-sans">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">City Not Found</h1>
          <p className="text-lg text-slate-300">
            The city &quot;{cityName}&quot; does not exist in our database.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const content: CityContent | null = city.content as CityContent | null;

  return (
    <main className="bg-slate-900 text-white min-h-screen p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 text-center text-sky-300">
          {city.name}
        </h1>
        <p className="text-center text-slate-400 mb-8">
          {content?.country || city.continent}
        </p>

        {city.status === "pending" && (
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-lg text-slate-300 mt-4 animate-pulse">
              Our AI is currently gathering information and building a profile
              for {city.name}. Please check back shortly!
            </p>
          </div>
        )}

        {city.status === "error" && (
          <ErrorDisplay
            message={`We encountered an error while trying to generate content for ${city.name}. Please try again later.`}
          />
        )}

        {city.status === "ready" && content && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-2xl font-semibold mb-3 text-sky-400">
                History
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {content.history}
              </p>
            </div>
            <div className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-2xl font-semibold mb-3 text-sky-400">
                Geography
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {content.geography}
              </p>
            </div>
            <div className="p-6 bg-slate-800 rounded-lg">
              <h3 className="text-2xl font-semibold mb-3 text-sky-400">
                Economy
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {content.economy}
              </p>
            </div>

            {renderList("Landmarks", content.landmarks)}
            {renderList("Myths", content.myths)}

            {renderNewsOrEvents("Latest News", content.latestNews)}
            {renderNewsOrEvents("Upcoming Events", content.upcomingEvents)}
          </div>
        )}
      </div>
    </main>
  );
}
