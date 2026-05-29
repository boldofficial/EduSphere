'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Users, TrendingUp, School, Filter } from 'lucide-react';
import { useFeedbackList, useFeedbackStats } from '@/lib/hooks/use-feedback';
import { useAdminSchools } from '@/lib/hooks/use-data';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-300'}
        />
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'brand',
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function FeedbackTab() {
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [schoolFilter, setSchoolFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useFeedbackStats();
  const { data: list, isLoading: listLoading } = useFeedbackList({
    rating: ratingFilter,
    school: schoolFilter,
    page,
  });
  const { data: schools = [] } = useAdminSchools();

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

  const ratingColor = (r: number) => {
    if (r >= 4) return 'text-emerald-600 bg-emerald-50';
    if (r === 3) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const ratingBarWidth = (count: number) => {
    if (!stats?.total) return '0%';
    return `${Math.round((count / stats.total) * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Feedback</h1>
        <p className="text-gray-500 mt-1 font-medium">Platform feedback submitted by school users.</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={MessageSquare} label="Total Responses" value={stats?.total ?? 0} color="brand" />
          <StatCard
            icon={Star}
            label="Average Rating"
            value={stats?.average_rating ? `${stats.average_rating} / 5` : '—'}
            color="amber"
          />
          <StatCard
            icon={TrendingUp}
            label="5-Star Responses"
            value={stats?.distribution?.['5'] ?? 0}
            sub={stats?.total ? `${Math.round(((stats.distribution?.['5'] ?? 0) / stats.total) * 100)}% of total` : undefined}
            color="green"
          />
          <StatCard
            icon={Users}
            label="1–2 Star Responses"
            value={(stats?.distribution?.['1'] ?? 0) + (stats?.distribution?.['2'] ?? 0)}
            color="purple"
          />
        </div>
      )}

      {/* Rating Distribution */}
      {stats && stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution?.[String(star)] ?? 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-bold text-gray-600">{star}</span>
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: ratingBarWidth(count) }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={16} />
          <span className="font-semibold">Filter by:</span>
        </div>
        <select
          value={ratingFilter ?? ''}
          onChange={(e) => { setRatingFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-brand-500"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
          ))}
        </select>
        <select
          value={schoolFilter ?? ''}
          onChange={(e) => { setSchoolFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-brand-500"
        >
          <option value="">All schools</option>
          {schools.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {(ratingFilter || schoolFilter) && (
          <button
            onClick={() => { setRatingFilter(undefined); setSchoolFilter(undefined); setPage(1); }}
            className="text-sm font-bold text-brand-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Feedback List */}
      {listLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : list?.results?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-500">No feedback yet</p>
          <p className="text-sm text-gray-400 mt-1">Feedback submitted by users will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list?.results?.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <StarDisplay rating={item.rating} />
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${ratingColor(item.rating)}`}>
                      {item.rating} / 5
                    </span>
                    {item.school_name && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                        <School size={12} />
                        {item.school_name}
                      </span>
                    )}
                    {item.user_role && (
                      <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {item.user_role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  {item.comment ? (
                    <p className="text-sm text-gray-700 leading-relaxed">{item.comment}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No comment provided.</p>
                  )}
                  {item.page_url && (
                    <p className="text-xs text-gray-400 mt-1.5">Page: {item.page_url}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-gray-500">{item.username || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {list && list.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-500">
            Page {list.current_page} of {list.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(list.total_pages, p + 1))}
            disabled={page === list.total_pages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
