import { useState } from 'react';

// Reusable skeleton components for API-loading states

// Shows a pulsing skeleton until the image finishes loading, then fades it in.
export function ImageWithSkeleton({ src, alt, className = '', containerClassName = '', skeletonClassName = '' }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${skeletonClassName}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`block transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}

export function CityGridSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg px-4 py-3 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded mb-1.5" />
            <div className="h-3 w-10 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MovieSliderSkeleton({ count = 5 }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-40 border rounded overflow-hidden bg-white shadow-sm animate-pulse"
        >
          <div className="w-full h-56 bg-gray-200" />
          <div className="p-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MovieGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border rounded overflow-hidden bg-white shadow-sm animate-pulse"
        >
          <div className="w-full h-56 bg-gray-200" />
          <div className="p-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-100 rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MovieDetailsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Backdrop */}
      <div className="w-full h-60 md:h-80 bg-gray-200 animate-pulse" />

      <div className="px-5 md:px-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 -mt-16 md:-mt-24 relative">
          {/* Poster */}
          <div className="flex-shrink-0 self-start mx-auto md:mx-0">
            <div className="w-28 md:w-44 h-40 md:h-64 bg-gray-300 rounded-xl animate-pulse shadow-2xl" />
          </div>

          {/* Info */}
          <div className="flex-1 md:pt-24 animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-3" />
            <div className="flex items-center gap-2 mb-5">
              <div className="h-5 w-12 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg mb-6" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-5/6 bg-gray-100 rounded" />
              <div className="h-3 w-4/6 bg-gray-100 rounded" />
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="mt-8 border-t pt-6 grid grid-cols-2 sm:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-12 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CinemaListSkeleton({ count = 3 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border rounded-lg p-5 bg-white shadow-sm animate-pulse"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-64 bg-gray-100 rounded" />
            </div>
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-9 w-28 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookingListSkeleton({ count = 3 }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm animate-pulse"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
                <div className="h-4 w-36 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>
            <hr className="my-3 border-gray-100" />
            <div className="flex gap-6">
              <div>
                <div className="h-3 w-10 bg-gray-100 rounded mb-1" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div>
                <div className="h-3 w-14 bg-gray-100 rounded mb-1" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeatGridSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Screen indicator */}
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-t-full mx-auto w-3/4" />
        <div className="h-3 w-16 bg-gray-100 rounded mx-auto mt-1" />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="w-14 h-3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded shrink-0" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="w-8 h-8 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
