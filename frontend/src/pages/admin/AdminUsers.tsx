import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Loader2, User } from 'lucide-react';
import api from '../../utils/api';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isPremium: boolean;
  createdAt: string;
  _count: { trips: number; devices: number; subscriptions: number };
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number, q: string) => {
    setLoading(true);
    api.get('/admin/users', { params: { page: p, limit: 20, search: q } })
      .then(r => {
        setUsers(r.data.data);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(page, query);
  }, [page, query, load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="bg-slate-800 border border-slate-700 text-white text-sm pl-9 pr-4 py-2 rounded-lg w-64 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 hidden md:table-cell">Trips</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 hidden md:table-cell">Devices</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No users found</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <User size={15} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.fullName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      u.role === 'ADMIN'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                    }`}>
                      {u.role}
                    </span>
                    {u.isPremium && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{u._count.trips}</td>
                  <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{u._count.devices}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      to={`/admin/users/${u.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
