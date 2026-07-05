import { useCallback, useEffect, useState } from 'react';
import { del, get, post, put } from '../../api';
import Button from '../../components/Button';
import { showConfirm, showError, showSuccess } from '../../utils/swal';

const EMPTY_FORM = {
  city_code: '',
  city_name: '',
};

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500';

function StatCard({ label, value }) {
  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

function RegionSkeleton() {
  return (
    <div className="animate-pulse rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-3 h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-4 h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function formatCreatedAt(value) {
  if (!value) return 'Recently added';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently added';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function buildRegionPayload(form) {
  return {
    city_code: form.city_code.trim().toUpperCase(),
    city_name: form.city_name.trim(),
  };
}

export default function Regions() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [regions, setRegions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);

  const isEditing = Boolean(editingRegion);

  const loadRegions = useCallback(async (page = 1, query = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) {
        params.set('search', query);
      }

      const { data, pagination: pageInfo } = await get(`/region?${params}`);
      setRegions(Array.isArray(data) ? data : []);
      setPagination({
        page: pageInfo?.page ?? page,
        totalPages: Math.max(pageInfo?.totalPages ?? 1, 1),
        totalItems: pageInfo?.totalItems ?? data?.length ?? 0,
      });
    } catch (err) {
      showError(err.message, 'Could not load regions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    loadRegions(1, search);
  }, [loadRegions, search]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingRegion(null);
  }

  function handleCodeChange(e) {
    const nextCode = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setForm((prev) => ({ ...prev, city_code: nextCode }));
  }

  function handleNameChange(e) {
    setForm((prev) => ({ ...prev, city_name: e.target.value }));
  }

  function handleEdit(region) {
    setEditingRegion(region);
    setForm({
      city_code: region.city_code ?? '',
      city_name: region.city_name ?? '',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = buildRegionPayload(form);
    if (!payload.city_code || !payload.city_name) {
      showError('Enter both a city code and city name.', 'Missing details');
      return;
    }

    const city_id = editingRegion?.id;
    setSaving(true);

    try {
      let savedRegion;

      if (city_id) {
        const { data } = await put(`/region/${city_id}`, {
          new_city_code: payload.city_code,
          new_city_name: payload.city_name,
        });
        savedRegion = data;
      } else {
        const { data } = await post('/region', payload);
        savedRegion = data;
      }

      resetForm();
      await loadRegions(city_id ? pagination.page : 1, search);
      showSuccess(
        `${savedRegion.city_name} (${savedRegion.city_code}) ${city_id ? 'updated' : 'created'} successfully.`,
        city_id ? 'Region updated' : 'Region created'
      );
    } catch (err) {
      showError(
        err.message,
        city_id ? 'Could not update region' : 'Could not create region'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(region) {
    const ok = await showConfirm(
      'If cinemas still use this region the delete will be blocked so existing links stay safe.',
      {
        title: `Delete ${region.city_name} (${region.city_code})?`,
        confirmText: 'Delete',
        danger: true,
      }
    );
    if (!ok) return;

    setDeleting(true);

    try {
      await del(`/region/${region.id}`);

      if (editingRegion?.id === region.id) {
        resetForm();
      }

      const nextPage =
        regions.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadRegions(nextPage, search);
      showSuccess(
        `${region.city_name} (${region.city_code}) was removed from the region list.`,
        'Region deleted'
      );
    } catch (err) {
      showError(err.message, 'Could not delete region');
    } finally {
      setDeleting(false);
    }
  }

  const totalRegions = pagination.totalItems;
  const visibleRegions = regions.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              Admin · Regions
            </p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              Manage regions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Create region codes, rename markets, and keep cinema mapping tidy
              without leaving the page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <StatCard label="Regions" value={totalRegions} />
            <StatCard label="Visible" value={visibleRegions} />
            <StatCard label="Mode" value={isEditing ? 'Edit' : 'Create'} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Region registry
              </p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isEditing ? 'Edit region' : 'Add a new region'}
              </h2>
            </div>
            {isEditing && (
              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                Live edit
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Use a short, memorable city code. These regions power cinema linking
            and the public city picker.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City code
              </span>
              <input
                type="text"
                placeholder="BLR"
                value={form.city_code}
                onChange={handleCodeChange}
                className={inputClass}
                maxLength={12}
                autoCapitalize="characters"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City name
              </span>
              <input
                type="text"
                placeholder="Bangalore"
                value={form.city_name}
                onChange={handleNameChange}
                className={inputClass}
                required
              />
            </label>

            <div className="rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-300">
              <p className="font-medium">Naming tip</p>
              <p>
                Keep codes short and unique. Example: BLR for Bangalore or HYD
                for Hyderabad.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                fullWidth
                loading={saving}
                loadingText={isEditing ? 'Saving…' : 'Creating…'}
              >
                {isEditing ? 'Save changes' : 'Create region'}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Region library
              </p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Search, update, or retire regions
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Filter by city name or code and manage records without jumping
                between screens.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadRegions(pagination.page, search)}
              disabled={loading}
            >
              Refresh list
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by city name or code"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={inputClass}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 transition hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
              {search
                ? `Showing results for "${search}"`
                : 'Showing all regions'}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                <RegionSkeleton />
                <RegionSkeleton />
                <RegionSkeleton />
              </div>
            ) : regions.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 px-6 py-12 text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {search
                    ? 'No regions matched your search.'
                    : 'No regions yet.'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {search
                    ? 'Try a different city name or code, or clear the search to browse the full region list.'
                    : 'Create your first region to start connecting cinemas and city-based booking flows.'}
                </p>
                {search && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5"
                    onClick={() => setSearchInput('')}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              regions.map((region) => {
                const active = editingRegion?.id === region.id;
                return (
                  <article
                    key={region.id}
                    className={`rounded border p-4 transition sm:p-5 ${
                      active
                        ? 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {region.city_name}
                          </h3>
                          <span className="rounded bg-gray-900 dark:bg-gray-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white dark:text-gray-900">
                            {region.city_code}
                          </span>
                          {active && (
                            <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                              Editing now
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Created {formatCreatedAt(region.created_at)}
                          </span>
                          <span>Used for cinema mapping</span>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(region)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={deleting}
                          onClick={() => handleDelete(region)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {pagination.totalPages > 1 && !loading && (
            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadRegions(pagination.page - 1, search)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadRegions(pagination.page + 1, search)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
