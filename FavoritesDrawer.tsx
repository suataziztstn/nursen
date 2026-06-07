import { useState, useEffect } from 'react';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    return params.get('page') === 'admin' || hash === '#admin' ? 'admin' : 'store';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      setPage(params.get('page') === 'admin' || hash === '#admin' ? 'admin' : 'store');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return page === 'admin' ? <AdminPage /> : <StorePage />;
}
