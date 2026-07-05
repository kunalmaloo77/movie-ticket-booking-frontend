import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { get, post, patch, del } from '../../api';
import Button from '../../components/Button';
import { showSuccess, showError } from '../../utils/swal_utils';

const EMPTY_RANGE = { rowStart: '', rowEnd: '', cols: '', category_id: '' };

function hasOverlap(ranges, skipIndex, start, end) {
  return ranges.some((r, i) => {
    if (i === skipIndex) return false;
    if (!r.rowStart || !r.rowEnd) return false;
    return start <= r.rowEnd && end >= r.rowStart;
  });
}

function getGappedRows(ranges) {
  if (ranges.length < 2) return [];
  const sorted = [...ranges].sort((a, b) =>
    a.rowStart.localeCompare(b.rowStart)
  );
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const endCode = sorted[i].rowEnd.codePointAt(0);
    const nextStartCode = sorted[i + 1].rowStart.codePointAt(0);
    for (let c = endCode + 1; c < nextStartCode; c++) {
      gaps.push(String.fromCodePoint(c));
    }
  }
  return gaps;
}

const inputClass =
  'w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500';

export default function AddEditSeatLayout() {
  const { cinema_id } = useParams();
  const [categories, setCategories] = useState([]);
  const [screens, setScreens] = useState([]);
  const [screenName, setScreenName] = useState('');
  const [screenTypes, setScreenTypes] = useState([]);
  const [selectedScreenType, setSelectedScreenType] = useState('');
  const [rowRanges, setRowRanges] = useState([{ ...EMPTY_RANGE }]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [originalScreen, setOriginalScreen] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [seatRes, screenRes, existingScreensRes] = await Promise.allSettled(
        [
          get('/seats/categories'),
          get('/screen/screen-types'),
          get(`/screen/cinema/${cinema_id}`),
        ]
      );
      if (seatRes.status === 'fulfilled')
        setCategories(seatRes.value.data ?? []);
      if (screenRes.status === 'fulfilled')
        setScreenTypes(screenRes.value.data);
      if (existingScreensRes.status === 'fulfilled') {
        setScreens(existingScreensRes.value.data ?? []);
      }
    };
    fetchData();
  }, [cinema_id]);

  function updateRange(index, field, value) {
    setRowRanges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`range_${index}_${field}`];
      delete next[`range_${index}_overlap`];
      return next;
    });
  }

  function removeRowRange(index) {
    setRowRanges((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next)
        .filter((k) => k.startsWith(`range_${index}_`))
        .forEach((k) => delete next[k]);
      return next;
    });
  }

  function validate() {
    const errs = {};
    if (!screenName.trim()) errs.screenName = 'Screen name is required';

    rowRanges.forEach((r, i) => {
      if (!r.rowStart) errs[`range_${i}_rowStart`] = 'Required';
      if (!r.rowEnd) errs[`range_${i}_rowEnd`] = 'Required';
      if (!r.cols) errs[`range_${i}_cols`] = 'Required';
      if (!r.category_id) errs[`range_${i}_category`] = 'Required';

      if (r.rowStart && r.rowEnd && r.rowEnd < r.rowStart)
        errs[`range_${i}_rowEnd`] = 'Must be ≥ row start';

      if (r.rowStart && r.rowEnd && r.rowEnd >= r.rowStart) {
        if (hasOverlap(rowRanges, i, r.rowStart, r.rowEnd))
          errs[`range_${i}_overlap`] = 'Overlaps with another range';
      }
    });

    return errs;
  }

  async function handleAddScreen() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      cinema_id: Number.parseInt(cinema_id, 10),
      name: screenName.trim(),
      screen_type_id: selectedScreenType,
      row_ranges: rowRanges.map((r) => ({
        rowStart: r.rowStart,
        rowEnd: r.rowEnd,
        cols: Number.parseInt(r.cols, 10) || 0,
        category_id: r.category_id,
      })),
    };

    setSaving(true);
    try {
      if (editingIndex === null) {
        const { data } = await post('/screen', payload);
        const newItem = {
          id: data.newScreen.id,
          name: data.newScreen.name,
          cinema_id: data.newScreen.cinema_id,
          screen_type_id: data.newScreen.screen_type,
          total_capacity: data.newScreen.total_capacity,
          row_ranges: data.row_ranges,
        };
        setScreens((prev) => [...prev, newItem]);
        showSuccess(`Screen created: ${newItem.name}`);
      } else {
        const screenId = screens[editingIndex].id;
        console.log(screens, 'Screens');
        const patchPayload = {};

        if (screenName.trim() !== originalScreen.name)
          patchPayload.name = screenName.trim();

        if (String(selectedScreenType) !== originalScreen.screen_type_id)
          patchPayload.screen_type_id = selectedScreenType;

        const normalizedRanges = rowRanges.map((r) => ({
          rowStart: r.rowStart,
          rowEnd: r.rowEnd,
          cols: Number.parseInt(r.cols),
          category_id: r.category_id,
        }));

        const originalRanges = originalScreen.row_ranges.map((r) => ({
          rowStart: r.rowStart,
          rowEnd: r.rowEnd,
          cols: Number.parseInt(r.cols),
          category_id: r.category_id,
        }));

        if (JSON.stringify(normalizedRanges) !== JSON.stringify(originalRanges))
          patchPayload.row_ranges = normalizedRanges;

        const { data } = await patch(`/screen/${screenId}`, patchPayload);
        const newItem = {
          row_ranges: data.row_ranges,
          name: data.updatedScreen.name,
          cinema_id: data.updatedScreen.cinema_id,
          screen_type_id: data.updatedScreen.screen_type,
          total_capacity: data.updatedScreen.total_capacity,
        };

        setScreens((prev) =>
          prev.map((s, i) => (i === editingIndex ? { ...s, ...newItem } : s))
        );
        setOriginalScreen(null);
        setEditingIndex(null);
        showSuccess(`Screen updated: ${newItem.name}`);
      }

      setScreenName('');
      setSelectedScreenType('');
      setRowRanges([{ ...EMPTY_RANGE }]);
      setErrors({});
    } catch (err) {
      console.error('Error Adding Updating screen', err);
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEditScreen(index) {
    const screen = screens[index];
    const ranges = screen.row_ranges.map((r) => ({
      ...r,
      cols: String(r.cols),
    }));
    setOriginalScreen({
      name: screen.name,
      screen_type_id: String(screen.screen_type_id),
      row_ranges: ranges,
    });
    setScreenName(screen.name);
    setSelectedScreenType(screen.screen_type_id);
    setRowRanges(ranges);
    setEditingIndex(index);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteScreen(index) {
    const screenId = screens[index].id;
    setSaving(true);
    try {
      await del(`/screen/${screenId}`);
      setScreens((prev) => prev.filter((_, i) => i !== index));
      if (editingIndex === index) {
        setScreenName('');
        setSelectedScreenType('');
        setRowRanges([{ ...EMPTY_RANGE }]);
        setEditingIndex(null);
      }
      showSuccess('Screen deleted');
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setScreenName('');
    setSelectedScreenType('');
    setRowRanges([{ ...EMPTY_RANGE }]);
    setEditingIndex(null);
    setOriginalScreen(null);
    setErrors({});
  }

  function getCategoryName(id) {
    return categories.find((c) => Number(c.id) === Number(id))?.name ?? id;
  }

  function getScreenTypeByName(id) {
    return screenTypes.find((t) => Number(t.id) === Number(id))?.name ?? id;
  }

  const validRanges = rowRanges.filter(
    (r) => r.rowStart && r.rowEnd && r.rowEnd >= r.rowStart
  );
  const gappedRows = getGappedRows(validRanges);

  const borderNormal = 'border-gray-300 dark:border-gray-600';
  const borderError = 'border-red-500';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">
        {editingIndex === null ? 'Add Screens' : 'Edit Screens'}
      </h1>

      <div>
        <input
          type="text"
          placeholder="Screen name (e.g. Screen 1, IMAX)"
          value={screenName}
          onChange={(e) => {
            setScreenName(e.target.value);
            setErrors((prev) => {
              const n = { ...prev };
              delete n.screenName;
              return n;
            });
          }}
          className={`${inputClass} border ${errors.screenName ? borderError : borderNormal}`}
        />
        {errors.screenName && (
          <p className="text-red-500 text-xs mt-1">{errors.screenName}</p>
        )}
      </div>

      <div>
        <select
          value={selectedScreenType}
          onChange={(e) => setSelectedScreenType(e.target.value)}
          className={`${inputClass} border ${errors.selectedScreenType ? borderError : borderNormal}`}
        >
          <option value="">Select Screen Type</option>
          {screenTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {errors.selectedScreenType && (
          <p className="text-red-500 text-xs mt-1">
            {errors.selectedScreenType}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Row Ranges</p>

        {rowRanges.map((range, i) => (
          <div key={i} className="space-y-1">
            <div className="flex gap-2 items-start">
              <input
                type="text"
                maxLength={1}
                placeholder="A"
                value={range.rowStart}
                onChange={(e) =>
                  updateRange(i, 'rowStart', e.target.value.toUpperCase())
                }
                className={`w-12 border rounded px-2 py-2 text-sm text-center bg-white dark:bg-gray-800 dark:text-gray-100 ${
                  errors[`range_${i}_rowStart`] ? borderError : borderNormal
                }`}
              />
              <span className="pt-2 text-sm">–</span>
              <input
                type="text"
                maxLength={1}
                placeholder="F"
                value={range.rowEnd}
                onChange={(e) =>
                  updateRange(i, 'rowEnd', e.target.value.toUpperCase())
                }
                className={`w-12 border rounded px-2 py-2 text-sm text-center bg-white dark:bg-gray-800 dark:text-gray-100 ${
                  errors[`range_${i}_rowEnd`] || errors[`range_${i}_overlap`]
                    ? borderError
                    : borderNormal
                }`}
              />
              <input
                type="number"
                min={1}
                placeholder="Cols"
                value={range.cols}
                onChange={(e) => updateRange(i, 'cols', e.target.value)}
                className={`w-20 border rounded px-2 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 ${
                  errors[`range_${i}_cols`] ? borderError : borderNormal
                }`}
              />
              <select
                value={range.category_id}
                onChange={(e) => updateRange(i, 'category_id', e.target.value)}
                className={`flex-1 border rounded px-2 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 ${
                  errors[`range_${i}_category`] ? borderError : borderNormal
                }`}
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {rowRanges.length > 1 && (
                <button
                  onClick={() => removeRowRange(i)}
                  className="pt-1.5 text-xl text-gray-400 hover:text-red-500 leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {(errors[`range_${i}_overlap`] || errors[`range_${i}_rowEnd`]) && (
              <p className="text-red-500 text-xs pl-1">
                {errors[`range_${i}_overlap`] || errors[`range_${i}_rowEnd`]}
              </p>
            )}
          </div>
        ))}

        {gappedRows.length > 0 && (
          <p className="text-amber-600 dark:text-amber-400 text-xs">
            Row{gappedRows.length > 1 ? 's' : ''} {gappedRows.join(', ')}{' '}
            {gappedRows.length > 1 ? 'have' : 'has'} no seats — intentional?
          </p>
        )}

        <button
          onClick={() => setRowRanges((prev) => [...prev, { ...EMPTY_RANGE }])}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white underline"
        >
          + Add Row Range
        </button>
      </div>

      <div className="flex gap-2 flex-col">
        <div className="flex gap-2">
          <Button
            onClick={handleAddScreen}
            size="sm"
            loading={saving}
            loadingText={editingIndex === null ? 'Adding…' : 'Updating…'}
          >
            {editingIndex === null ? 'Add Screen' : 'Update Screen'}
          </Button>
          {editingIndex !== null && (
            <Button
              onClick={handleCancelEdit}
              size="sm"
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {screens.length > 0 && (
        <div className="border-t dark:border-gray-700 pt-4 space-y-2">
          <p className="text-sm font-semibold">Screens Added</p>
          {screens.map((screen, i) => (
            <div
              key={i}
              className={`flex items-center justify-between border rounded px-3 py-2 text-sm transition-colors ${
                editingIndex === i
                  ? 'border-gray-900 dark:border-gray-300 bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div>
                <p className="font-medium">{screen.name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {getScreenTypeByName(screen.screen_type_id)}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {screen.row_ranges
                    .map(
                      (r) =>
                        `${r.rowStart}–${r.rowEnd} · ${r.cols} cols · ${getCategoryName(r.category_id)}`
                    )
                    .join('  |  ')}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {screen.total_capacity} seats
                </p>
              </div>
              <div className="flex gap-3 ml-4 shrink-0">
                <button
                  onClick={() => handleEditScreen(i)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteScreen(i)}
                  disabled={saving}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
