import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/evaluations', label: 'Evaluations' },
  { to: '/experiments', label: 'Experiments' },
  { to: '/datasets', label: 'Datasets' },
  { to: '/architecture', label: 'Architecture' },
];

export function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link to="/" className="font-semibold text-lg tracking-tight">
          AI Eval Platform
        </Link>
        <div className="flex gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={clsx(
                'hover:text-blue-600 transition-colors',
                pathname === l.to || (l.to !== '/' && pathname.startsWith(l.to))
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 dark:text-gray-300'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
