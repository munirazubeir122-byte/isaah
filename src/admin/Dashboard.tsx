import { useEffect, useState } from 'react';
import { api, errorText } from './api';
import { Card, fmtDate, PageTitle, StatusLine, type Status } from './ui';
import { episodeRecords } from '../data/episodes';

interface Stats {
  from: string;
  days: number;
  byDay: { day: string; views: number }[];
  byPath: { path: string; views: number }[];
  recent: { at: number; user: string; action: string; target: string }[];
}

function pageName(path: string, titles: Record<string, string>): string {
  if (path === '/') return 'Home';
  if (path === '/about') return 'About';
  if (path === '/contact') return 'Contact';
  const id = path.match(/^\/episode\/(.+)$/)?.[1];
  return id ? `Story: ${titles[id] ?? id}` : path;
}

export function Dashboard() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    api<Stats>(`admin/stats?days=${days}`)
      .then(setStats)
      .catch((e) => setStatus({ kind: 'error', text: errorText(e) }));
  }, [days]);
  useEffect(() => {
    const fallback = Object.fromEntries(episodeRecords().map((e) => [e.id, e.text.EN?.title ?? e.id]));
    api<{ episodes: { id: string; text: { EN?: { title: string } } }[] }>('admin/content')
      .then((c) => setTitles(Object.fromEntries(c.episodes.map((e) => [e.id, e.text.EN?.title ?? e.id]))))
      .catch(() => setTitles(fallback));
  }, []);

  // Fill in days with no visits so the chart has no gaps.
  const series: { day: string; views: number }[] = [];
  if (stats) {
    const map = new Map(stats.byDay.map((d) => [d.day, d.views]));
    const start = new Date(`${stats.from}T00:00:00Z`).getTime();
    for (let i = 0; i < stats.days; i++) {
      const day = new Date(start + i * 86400_000).toISOString().slice(0, 10);
      series.push({ day, views: map.get(day) ?? 0 });
    }
  }
  const total = series.reduce((s, d) => s + d.views, 0);
  const max = Math.max(1, ...series.map((d) => d.views));

  return (
    <>
      <PageTitle sub="Page views are counted per page and per day only. No cookies, IP addresses or other details about visitors are stored.">
        Dashboard
      </PageTitle>
      <StatusLine status={status} />
      <div className="space-y-6">
        <Card
          title="Visitors"
          actions={
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-moss bg-ink px-2 py-1 text-sm">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          }
        >
          <p className="mb-4 text-sm text-mist">
            <span className="font-serif text-4xl font-bold text-snow">{total.toLocaleString()}</span> page views
          </p>
          <div className="flex h-40 items-end gap-[2px]" role="img" aria-label={`Page views per day, ${total} in total`}>
            {series.map((d) => (
              <div key={d.day} className="group relative flex-1">
                <div className="w-full rounded-t bg-moss group-hover:bg-gold" style={{ height: `${Math.max(2, (d.views / max) * 160)}px` }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs whitespace-nowrap text-snow group-hover:block">
                  {d.day}: {d.views}
                </span>
              </div>
            ))}
          </div>
          {series.length > 0 && (
            <div className="mt-1 flex justify-between text-xs text-sage">
              <span>{series[0].day}</span>
              <span>{series[series.length - 1].day}</span>
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Most viewed pages">
            {stats?.byPath.length ? (
              <table className="w-full text-sm">
                <tbody>
                  {stats.byPath.map((p) => (
                    <tr key={p.path} className="border-b border-moss/40 last:border-0">
                      <td className="py-2 pr-3 text-paper">{pageName(p.path, titles)}</td>
                      <td className="py-2 text-right font-semibold text-snow">{p.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-sage">No visits recorded yet.</p>
            )}
          </Card>
          <Card title="Recent activity">
            {stats?.recent.length ? (
              <ul className="space-y-2 text-sm">
                {stats.recent.map((r, i) => (
                  <li key={i} className="border-b border-moss/40 pb-2 last:border-0">
                    <span className="text-snow">{r.user}</span> <span className="text-mist">{r.action}</span>
                    {r.target && <span className="text-paper"> · {r.target}</span>}
                    <div className="text-xs text-sage">{fmtDate(r.at)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-sage">Nothing yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
