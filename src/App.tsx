import { useMemo, useState } from 'react';

type CoastalPlace = {
  name: string;
  region: string;
  avgHigh: number;
  avgLow: number;
  humidity: 'low' | 'medium' | 'high';
  vibe: string;
};

const newportBeachBaseline: CoastalPlace = {
  name: 'Newport Beach, CA',
  region: 'United States',
  avgHigh: 73,
  avgLow: 57,
  humidity: 'medium',
  vibe: 'Upscale beach city with marinas, coastal shopping, and calm ocean weather.',
};

const similarPlaces: CoastalPlace[] = [
  {
    name: 'Santa Barbara, CA',
    region: 'United States',
    avgHigh: 72,
    avgLow: 54,
    humidity: 'medium',
    vibe: 'Mediterranean-style coastline with a polished downtown and beach culture.',
  },
  {
    name: 'Coronado, CA',
    region: 'United States',
    avgHigh: 71,
    avgLow: 58,
    humidity: 'medium',
    vibe: 'Clean beaches, resort vibe, and relaxed upscale feel.',
  },
  {
    name: 'La Jolla, CA',
    region: 'United States',
    avgHigh: 70,
    avgLow: 57,
    humidity: 'medium',
    vibe: 'Scenic cliffs, coastal dining, and walkable village atmosphere.',
  },
  {
    name: 'Carmel-by-the-Sea, CA',
    region: 'United States',
    avgHigh: 65,
    avgLow: 52,
    humidity: 'medium',
    vibe: 'Boutique seaside town with cool ocean breezes and artsy charm.',
  },
  {
    name: 'Laguna Beach, CA',
    region: 'United States',
    avgHigh: 72,
    avgLow: 56,
    humidity: 'medium',
    vibe: 'Coves, galleries, and a similar Orange County coastal lifestyle.',
  },
  {
    name: 'Noosa Heads, Australia',
    region: 'Australia',
    avgHigh: 78,
    avgLow: 63,
    humidity: 'high',
    vibe: 'Stylish beach town with surf breaks, restaurants, and bay walks.',
  },
  {
    name: 'Cascais, Portugal',
    region: 'Portugal',
    avgHigh: 72,
    avgLow: 59,
    humidity: 'medium',
    vibe: 'Elegant Atlantic coastal town with marinas and sunny promenades.',
  },
  {
    name: 'Biarritz, France',
    region: 'France',
    avgHigh: 70,
    avgLow: 56,
    humidity: 'medium',
    vibe: 'Refined beach destination known for surfing and oceanfront architecture.',
  },
];

function toSeasonalOffset(monthIndex: number): number {
  const seasonalCurve = [0, 0, 2, 4, 6, 8, 9, 9, 7, 4, 2, 0];
  return seasonalCurve[monthIndex] ?? 0;
}

function App() {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const monthIndex = selectedDate ? new Date(`${selectedDate}T00:00:00`).getMonth() : new Date().getMonth();

  const suggestions = useMemo(() => {
    const offset = toSeasonalOffset(monthIndex);

    return similarPlaces
      .map((place) => {
        const estHigh = place.avgHigh + offset;
        const estLow = place.avgLow + Math.max(offset - 2, 0);
        const similarityScore =
          100 -
          (Math.abs(place.avgHigh - newportBeachBaseline.avgHigh) * 2 +
            Math.abs(place.avgLow - newportBeachBaseline.avgLow) * 1.5);

        return {
          ...place,
          estHigh,
          estLow,
          score: Math.round(Math.max(similarityScore, 0)),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [monthIndex]);

  return (
    <div className="min-h-screen bg-sky-50 text-slate-900">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold">Newport Beach-Like Destination Finder</h1>
        <p className="mt-2 text-slate-700">
          Pick a calendar date and get coastal locations with a similar vibe to Newport Beach plus estimated
          temperatures.
        </p>

        <section className="mt-6 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <label htmlFor="trip-date" className="block text-sm font-semibold text-slate-700">
            Select a date
          </label>
          <input
            id="trip-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-2 rounded-lg border border-slate-300 px-3 py-2"
          />
          <p className="mt-2 text-sm text-slate-600">
            {selectedDate
              ? `Showing estimates for ${selectedDate}.`
              : 'No date picked yet. Using the current month for default estimates.'}
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {suggestions.map((place) => (
            <article key={place.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{place.name}</h2>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">
                  Match: {place.score}%
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{place.region}</p>
              <p className="mt-3 text-sm text-slate-700">{place.vibe}</p>
              <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
                <p>
                  <strong>Estimated High:</strong> {place.estHigh}°F
                </p>
                <p>
                  <strong>Estimated Low:</strong> {place.estLow}°F
                </p>
                <p>
                  <strong>Humidity Profile:</strong> {place.humidity}
                </p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
