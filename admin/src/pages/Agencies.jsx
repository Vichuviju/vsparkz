import { useEffect, useState } from 'react';
import api from '../lib/api';

export function Agencies() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (search) params.search = search;
    api
      .get('/admin/agencies', { params })
      .then(({ data }) => {
        setList(data.data ?? data ?? []);
        setMeta({
          current_page: data.current_page ?? 1,
          last_page: data.last_page ?? 1,
          total: data.total ?? 0,
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Agencies</h1>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchList(1);
          }}
          className="flex gap-2 flex-1 min-w-[200px]"
        >
          <input
            type="text"
            placeholder="Search agencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 placeholder-gray-400 text-sm focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            Search
          </button>
        </form>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center dark:text-text-muted text-gray-500">
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Name</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Slug</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Domain</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">
                      No agencies
                    </td>
                  </tr>
                ) : (
                  list.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{row.name}</td>
                      <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.slug ?? '—'}</td>
                      <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.domain ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {meta.last_page > 1 && (
          <div className="px-5 py-3 border-t dark:border-navy-600 border-gray-200 flex justify-between items-center text-sm dark:text-text-muted text-gray-500">
            <span>
              Page {meta.current_page} of {meta.last_page} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => fetchList(meta.current_page - 1)}
                className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => fetchList(meta.current_page + 1)}
                className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
