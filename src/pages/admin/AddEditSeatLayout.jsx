import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { get, post, put, del } from '../../api';

const EMPTY_RANGE = { rowStart: '', rowEnd: '', cols: '', category: '' };

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
    const endCode = sorted[i].rowEnd.charCodeAt(0);
    const nextStartCode = sorted[i + 1].rowStart.charCodeAt(0);
    for (let c = endCode + 1; c < nextStartCode; c++) {
      gaps.push(String.fromCharCode(c));
    }
  }
  return gaps;
}

export default function AddEditSeatLayout() {
  const { cinema_id } = useParams();
  const [categories, setCategories] = useState([]);
  const [screens, setScreens] = useState([]);
  const [screenName, setScreenName] = useState('');
  const [screenTypes, setScreenTypes] = useState([]);
  const [selectedScreenType, setSelectedScreenType] = useState('');
  const [rowRanges, setRowRanges] = useState([{ ...EMPTY_RANGE }]);
  const [editingIndex, setEditingIndex] = useState(null);
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
      if (seatRes.status === 'fulfilled') setCategories(seatRes.value);
      if (screenRes.status === 'fulfilled') setScreenTypes(screenRes.value);
      if (existingScreensRes.status === 'fulfilled')
        setScreens(existingScreensRes.value.data ?? []);
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
      if (!r.category) errs[`range_${i}_category`] = 'Required';

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
      cinema_id: cinema_id,
      name: screenName.trim(),
      screen_type_id: selectedScreenType,
      rowRanges: rowRanges.map((r) => ({
        rowStart: r.rowStart,
        rowEnd: r.rowEnd,
        cols: parseInt(r.cols),
        category: r.category,
      })),
    };

    setSaving(true);
    try {
      if (editingIndex !== null) {
        const screenId = screens[editingIndex].id;
        const updated = await put(`/screen/${screenId}`, payload);
        setScreens((prev) =>
          prev.map((s, i) => (i === editingIndex ? updated : s))
        );
        setEditingIndex(null);
      } else {
        const created = await post('/screen', { cinema_id, ...payload });
        setScreens((prev) => [...prev, created]);
      }

      setScreenName('');
      setSelectedScreenType('');
      setRowRanges([{ ...EMPTY_RANGE }]);
      setErrors({});
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  }

  function handleEditScreen(index) {
    const screen = screens[index];
    setScreenName(screen.name);
    setSelectedScreenType(screen.type);
    setRowRanges(screen.rowRanges.map((r) => ({ ...r, cols: String(r.cols) })));
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
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setScreenName('');
    setSelectedScreenType('');
    setRowRanges([{ ...EMPTY_RANGE }]);
    setEditingIndex(null);
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">
        {editingIndex !== null ? 'Edit Screens' : 'Add Screens'}
      </h1>

      {/* Screen name */}
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
          className={`w-full border rounded px-3 py-2 text-sm ${
            errors.screenName ? 'border-red-500' : 'border-black'
          }`}
        />
        {errors.screenName && (
          <p className="text-red-500 text-xs mt-1">{errors.screenName}</p>
        )}
      </div>

      {/* Screen type */}
      <div>
        <select
          value={selectedScreenType}
          onChange={(e) => setSelectedScreenType(e.target.value)}
          className={`w-full border rounded px-3 py-2 text-sm ${
            errors.selectedScreenType ? 'border-red-500' : 'border-black'
          }`}
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

      {/* Row ranges */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Row Ranges</p>

        {rowRanges.map((range, i) => (
          <div key={i} className="space-y-1">
            <div className="flex gap-2 items-start">
              {/* Row Start */}
              <input
                type="text"
                maxLength={1}
                placeholder="A"
                value={range.rowStart}
                onChange={(e) =>
                  updateRange(i, 'rowStart', e.target.value.toUpperCase())
                }
                className={`w-12 border rounded px-2 py-2 text-sm text-center ${
                  errors[`range_${i}_rowStart`]
                    ? 'border-red-500'
                    : 'border-black'
                }`}
              />
              <span className="pt-2 text-sm">–</span>
              {/* Row End */}
              <input
                type="text"
                maxLength={1}
                placeholder="F"
                value={range.rowEnd}
                onChange={(e) =>
                  updateRange(i, 'rowEnd', e.target.value.toUpperCase())
                }
                className={`w-12 border rounded px-2 py-2 text-sm text-center ${
                  errors[`range_${i}_rowEnd`] || errors[`range_${i}_overlap`]
                    ? 'border-red-500'
                    : 'border-black'
                }`}
              />
              {/* Cols */}
              <input
                type="number"
                min={1}
                placeholder="Cols"
                value={range.cols}
                onChange={(e) => updateRange(i, 'cols', e.target.value)}
                className={`w-20 border rounded px-2 py-2 text-sm ${
                  errors[`range_${i}_cols`] ? 'border-red-500' : 'border-black'
                }`}
              />
              {/* Category */}
              <select
                value={range.category}
                onChange={(e) => updateRange(i, 'category', e.target.value)}
                className={`flex-1 border rounded px-2 py-2 text-sm ${
                  errors[`range_${i}_category`]
                    ? 'border-red-500'
                    : 'border-black'
                }`}
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {/* Remove */}
              {rowRanges.length > 1 && (
                <button
                  onClick={() => removeRowRange(i)}
                  className="pt-1.5 text-xl text-gray-400 hover:text-red-500 leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* Per-range error */}
            {(errors[`range_${i}_overlap`] || errors[`range_${i}_rowEnd`]) && (
              <p className="text-red-500 text-xs pl-1">
                {errors[`range_${i}_overlap`] || errors[`range_${i}_rowEnd`]}
              </p>
            )}
          </div>
        ))}

        {/* Gap warning */}
        {gappedRows.length > 0 && (
          <p className="text-amber-600 text-xs">
            Row{gappedRows.length > 1 ? 's' : ''} {gappedRows.join(', ')}{' '}
            {gappedRows.length > 1 ? 'have' : 'has'} no seats — intentional?
          </p>
        )}

        <button
          onClick={() => setRowRanges((prev) => [...prev, { ...EMPTY_RANGE }])}
          className="text-sm text-gray-500 hover:text-black underline"
        >
          + Add Row Range
        </button>
      </div>

      {/* Form actions */}
      <div className="flex gap-2 flex-col">
        {errors.api && <p className="text-red-500 text-xs">{errors.api}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleAddScreen}
            disabled={saving}
            className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {editingIndex !== null ? 'Update Screen' : 'Add Screen'}
          </button>
          {editingIndex !== null && (
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="border border-gray-400 text-gray-600 px-4 py-2 rounded text-sm hover:border-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Screens list */}
      {screens.length > 0 && (
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-semibold">Screens Added</p>
          {screens.map((screen, i) => (
            <div
              key={i}
              className={`flex items-center justify-between border rounded px-3 py-2 text-sm ${
                editingIndex === i
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200'
              }`}
            >
              <div>
                <p className="font-medium">{screen.name}</p>
                <p className="text-gray-500 text-xs">
                  {getScreenTypeByName(screen.type)}
                </p>
                <p className="text-gray-500 text-xs">
                  {screen.rowRanges
                    .map(
                      (r) =>
                        `${r.rowStart}–${r.rowEnd} · ${r.cols} cols · ${getCategoryName(r.category)}`
                    )
                    .join('  |  ')}
                </p>
                <p className="text-gray-500 text-xs">
                  {screen.total_capacity} seats
                </p>
              </div>
              <div className="flex gap-3 ml-4 shrink-0">
                <button
                  onClick={() => handleEditScreen(i)}
                  className="text-xs text-gray-500 hover:text-black underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteScreen(i)}
                  disabled={saving}
                  className="text-xs text-gray-500 hover:text-red-500 underline disabled:opacity-50"
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
