import { Link } from 'react-router-dom';

const links = [
  { to: '/admin/regions', label: 'Manage Regions' },
  { to: '/admin/cinemas', label: 'Manage Cinemas' },
  { to: '/admin/movies', label: 'Manage Movies' },
  { to: '/admin/shows', label: 'Manage Shows' },
  { to: '/admin/screens', label: 'Manage Screens' },
];

export default function Dashboard() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="border border-gray-200 dark:border-gray-700 rounded p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
