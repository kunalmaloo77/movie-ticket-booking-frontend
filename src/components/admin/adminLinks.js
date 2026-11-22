import {
  BarChart3,
  MapPin,
  Building2,
  Film,
  Clapperboard,
  ListPlus,
  Columns3,
} from 'lucide-react';

// `end` stops a parent route (e.g. /admin/shows) from also being marked
// active on a child route (/admin/shows/bulk).
export const ADMIN_LINKS = [
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/regions', label: 'Regions', icon: MapPin },
  { to: '/admin/cinemas', label: 'Cinemas', icon: Building2 },
  { to: '/admin/movies', label: 'Movies', icon: Film },
  { to: '/admin/shows', label: 'Shows', icon: Clapperboard, end: true },
  { to: '/admin/shows/bulk', label: 'Bulk Add Shows', icon: ListPlus },
  { to: '/admin/screens', label: 'Screens', icon: Columns3 },
];
