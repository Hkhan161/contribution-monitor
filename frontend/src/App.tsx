import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const MODES = ['Search', 'Export'] as const;
type Mode = typeof MODES[number];

type Contribution = {
  NAME: string;
  CITY: string;
  STATE: string;
  ZIP_CODE: string;
  EMPLOYER: string;
  OCCUPATION: string;
  TRANSACTION_DT: string;
  TRANSACTION_AMT: number;
  SUB_ID: string;
  score: number;
};

function App() {
  const [mode, setMode] = useState<Mode>('Search');

  // Search state
  const [names, setNames] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<Contribution[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    const nameList = names
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (nameList.length === 0) {
      setError('Please enter at least one name.');
      setLoading(false);
      return;
    }
    const params = new URLSearchParams();
    nameList.forEach((n) => params.append('names', n));
    if (city.trim()) params.append('city', city.trim());
    try {
      const res = await fetch(`http://127.0.0.1:8001/search?${params.toString()}`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Search failed.');
      }
      const data = await res.json();
      setResults(data.results);
    } catch (err: any) {
      setError(err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  // Export state
  const [exportFile, setExportFile] = useState<File | null>(null);
  const [exportCity, setExportCity] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportLoading(true);
    setExportError(null);
    if (!exportFile) {
      setExportError('Please upload a .txt file.');
      setExportLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('file', exportFile);
    if (exportCity.trim()) formData.append('city', exportCity.trim());
    try {
      const res = await fetch('http://127.0.0.1:8001/export', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Export failed.');
      }
      const disposition = res.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] || 'results.csv';
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Export failed.');
    } finally {
      setExportLoading(false);
    }
  };

  // Group results by NAME, with total amount and max score
  function groupByNameWithTotalAndScore(results: Contribution[]) {
    const groups: Record<string, { contributions: Contribution[]; total: number; maxScore: number }> = {};
    results.forEach((c) => {
      if (!groups[c.NAME]) groups[c.NAME] = { contributions: [], total: 0, maxScore: 0 };
      groups[c.NAME].contributions.push(c);
      groups[c.NAME].total += c.TRANSACTION_AMT;
      groups[c.NAME].maxScore = Math.max(groups[c.NAME].maxScore, c.score ?? 0);
    });
    // Sort by maxScore descending, then by total descending, and limit to 20
    return Object.entries(groups)
      .map(([name, { contributions, total, maxScore }]) => ({ name, contributions, total, maxScore }))
      .sort((a, b) => b.maxScore - a.maxScore || b.total - a.total)
      .slice(0, 20);
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <div className="min-h-screen bg-greenboard-bg text-greenboard-cream font-sans">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-greenboard-surface">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight">Political Monitor</span>
        </div>
        <nav className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              className={`px-4 py-2 rounded-full font-semibold transition-colors duration-150
                ${mode === m ? 'bg-greenboard-accent text-greenboard-bg' : 'bg-greenboard-surface text-greenboard-cream hover:bg-greenboard-accent/80 hover:text-greenboard-bg'}`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-greenboard-surface rounded-xl shadow p-8 min-h-[400px]">
          {mode === 'Search' && (
            <>
              <h2 className="text-3xl font-bold mb-6">Search Contributions</h2>
              <form onSubmit={handleSearch} className="flex flex-col gap-4 mb-8">
                <label className="flex flex-col gap-2">
                  <span className="font-semibold">Names <span className="opacity-60 text-sm">(one per line)</span></span>
                  <textarea
                    className="bg-greenboard-bg text-greenboard-cream rounded-lg p-3 border border-greenboard-accent/30 focus:border-greenboard-accent outline-none resize-y min-h-[80px]"
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                    placeholder="e.g. Jane Smith\nJohn Doe"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-semibold">City <span className="opacity-60 text-sm">(optional)</span></span>
                  <input
                    className="bg-greenboard-bg text-greenboard-cream rounded-lg p-3 border border-greenboard-accent/30 focus:border-greenboard-accent outline-none"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New York"
                  />
                </label>
                <button
                  type="submit"
                  className="self-start mt-2 px-6 py-2 rounded-full bg-greenboard-accent text-greenboard-bg font-bold text-lg shadow hover:bg-greenboard-accent/90 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
              {error && (
                <div className="bg-red-700/80 text-red-100 rounded-lg px-4 py-3 mb-4 font-semibold">
                  {error}
                </div>
              )}
              {results && results.length === 0 && !loading && !error && (
                <div className="text-center text-lg opacity-70">No matches found.</div>
              )}
              {results && results.length > 0 && (
                <>
                  {/* Grouped, collapsible table with total contributions, max score, and top 20 groups */}
                  <div className="mb-10">
                    {groupByNameWithTotalAndScore(results).map((group) => (
                      <div key={group.name} className="mb-4 border border-greenboard-accent/20 rounded-lg bg-greenboard-bg">
                        <button
                          className="w-full text-left px-4 py-3 font-bold text-lg bg-greenboard-accent text-greenboard-bg rounded-t-lg flex justify-between items-center focus:outline-none"
                          onClick={() => setOpenGroups((prev) => ({ ...prev, [group.name]: !prev[group.name] }))}
                        >
                          <span>{group.name} <span className="opacity-60 text-base">({group.contributions.length} — ${group.total.toLocaleString()} — Score: {group.maxScore.toFixed(2)})</span></span>
                          <span className="ml-2">{openGroups[group.name] ? '▲' : '▼'}</span>
                        </button>
                        {openGroups[group.name] && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-greenboard-surface">
                                <tr>
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-right">Amount</th>
                                  <th className="px-3 py-2 text-left">City</th>
                                  <th className="px-3 py-2 text-left">Employer</th>
                                  <th className="px-3 py-2 text-left">Occupation</th>
                                  <th className="px-3 py-2 text-left">State</th>
                                  <th className="px-3 py-2 text-left">ZIP</th>
                                  <th className="px-3 py-2 text-right">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.contributions.map((c) => (
                                  <tr key={c.SUB_ID} className="even:bg-greenboard-surface/40 hover:bg-greenboard-accent/10 transition">
                                    <td className="px-3 py-2 whitespace-nowrap">{c.TRANSACTION_DT}</td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">${c.TRANSACTION_AMT.toLocaleString()}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{c.CITY}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{c.EMPLOYER}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{c.OCCUPATION}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{c.STATE}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{c.ZIP_CODE}</td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">{c.score.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Visualizations Section */}
                  <section className="mt-10">
                    <h3 className="text-2xl font-bold mb-4">Visualizations</h3>
                    {/* Contributions Over Time (by Month) */}
                    <div className="mb-8">
                      <h4 className="font-semibold mb-2">Contributions Over Time (by Month)</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getContributionsByMonth(results)} margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1ca7a7" opacity={0.1} />
                          <XAxis dataKey="month" stroke="#f5f5e6" />
                          <YAxis stroke="#f5f5e6" />
                          <Tooltip contentStyle={{ background: '#1a4747', color: '#f5f5e6', border: 'none' }} />
                          <Legend />
                          <Bar dataKey="total" fill="#1ca7a7" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Top Recipients */}
                    <div className="mb-8 overflow-x-auto">
                      <h4 className="font-semibold mb-2">Top Recipients (by Total Amount)</h4>
                      <ResponsiveContainer width={900} height={250}>
                        <BarChart data={getTopRecipients(results)} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1ca7a7" opacity={0.1} />
                          <XAxis type="number" stroke="#f5f5e6" />
                          <YAxis
                            dataKey="recipient"
                            type="category"
                            stroke="#f5f5e6"
                            width={400}
                            interval={0}
                            tick={({ y, payload }) => {
                              const label = payload.value.length > 30
                                ? payload.value.slice(0, 30) + '…'
                                : payload.value;
                              return (
                                <text
                                  x={0}
                                  y={y}
                                  fill="#f5f5e6"
                                  fontSize={14}
                                  dy={4}
                                  textAnchor="start"
                                >
                                  {label}
                                </text>
                              );
                            }}
                          />
                          <Tooltip contentStyle={{ background: '#1a4747', color: '#f5f5e6', border: 'none' }} />
                          <Legend />
                          <Bar dataKey="total" fill="#1ca7a7" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Largest Contributions */}
                    <div>
                      <h4 className="font-semibold mb-2">Largest Contributions</h4>
                      <ol className="list-decimal ml-6 space-y-1">
                        {getLargestContributions(results, 5).map((row, i) => (
                          <li key={row.SUB_ID} className="bg-greenboard-accent/10 rounded px-3 py-2 flex flex-col md:flex-row md:items-center md:gap-4">
                            <span className="font-bold text-greenboard-accent">${row.TRANSACTION_AMT.toLocaleString()}</span>
                            <span className="ml-2">{row.NAME} → {row.EMPLOYER || 'Unknown Employer'} ({row.TRANSACTION_DT})</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
          {mode === 'Export' && (
            <>
              <h2 className="text-3xl font-bold mb-6">Export Contributions</h2>
              <form onSubmit={handleExport} className="flex flex-col gap-4 mb-8">
                <label className="flex flex-col gap-2">
                  <span className="font-semibold">Upload .txt file <span className="opacity-60 text-sm">(one name per line)</span></span>
                  <input
                    type="file"
                    accept=".txt"
                    className="bg-greenboard-bg text-greenboard-cream rounded-lg p-3 border border-greenboard-accent/30 focus:border-greenboard-accent outline-none"
                    onChange={e => setExportFile(e.target.files?.[0] || null)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-semibold">City <span className="opacity-60 text-sm">(optional)</span></span>
                  <input
                    className="bg-greenboard-bg text-greenboard-cream rounded-lg p-3 border border-greenboard-accent/30 focus:border-greenboard-accent outline-none"
                    value={exportCity}
                    onChange={e => setExportCity(e.target.value)}
                    placeholder="e.g. New York"
                  />
                </label>
                <button
                  type="submit"
                  className="self-start mt-2 px-6 py-2 rounded-full bg-greenboard-accent text-greenboard-bg font-bold text-lg shadow hover:bg-greenboard-accent/90 transition disabled:opacity-60"
                  disabled={exportLoading}
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </button>
              </form>
              {exportError && (
                <div className="bg-red-700/80 text-red-100 rounded-lg px-4 py-3 mb-4 font-semibold">
                  {exportError}
                </div>
              )}
              <p className="text-lg opacity-80 mb-2">Upload a .txt file of names and download a CSV of all matching contributions.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

// Helper functions for visualizations
function getContributionsByYear(results: Contribution[]) {
  const byYear: Record<string, number> = {};
  results.forEach(r => {
    const year = r.TRANSACTION_DT.slice(0, 4);
    byYear[year] = (byYear[year] || 0) + r.TRANSACTION_AMT;
  });
  return Object.entries(byYear).map(([year, total]) => ({ year, total }));
}
function getContributionsByMonth(results: Contribution[]) {
  const byMonth: Record<string, number> = {};
  results.forEach(r => {
    // Format: YYYY-MM
    const month = r.TRANSACTION_DT.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + r.TRANSACTION_AMT;
  });
  return Object.entries(byMonth)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month)); // sort by month string
}
function getTopRecipients(results: Contribution[], topN = 5) {
  const byRecipient: Record<string, number> = {};
  results.forEach(r => {
    const recipient = r.EMPLOYER || 'Unknown';
    byRecipient[recipient] = (byRecipient[recipient] || 0) + r.TRANSACTION_AMT;
  });
  return Object.entries(byRecipient)
    .map(([recipient, total]) => ({ recipient, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
}
function getLargestContributions(results: Contribution[], topN = 5) {
  return [...results]
    .sort((a, b) => b.TRANSACTION_AMT - a.TRANSACTION_AMT)
    .slice(0, topN);
}
