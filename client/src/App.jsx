import VerifyBanner from './app/VerifyBanner.jsx';

import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import useMe from './app/useMe.js';
import ProtectedRoute from './app/ProtectedRoute.jsx';
import ClubsPage from './features/clubs/ClubsPage.jsx';
import ClubDetailPage from './features/clubs/ClubDetailPage.jsx';

import LoginPage from './features/auth/LoginPage.jsx';
import SignupPage from './features/auth/SignupPage.jsx';
import VerifyPage from './features/auth/VerifyPage.jsx';
import ForgotPage from './features/auth/ForgotPage.jsx';
import ResetPage from './features/auth/ResetPage.jsx';
import StockPage from './features/stock/StockPage.jsx';
import api from './api/client.js';
import './app/layout.css';

function Placeholder({ name }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Coming soon.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <h2>404</h2>
      <p>Page not found.</p>
    </div>
  );
}

function Header({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isBookseller = roles.includes('bookseller') || isAdmin;
  const isModerator =
    (user?.moderatorOf?.length ?? 0) > 0 || isAdmin;

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/');
    }
  }

  return (
    <header className="header">
      <NavLink to="/" className="brand">
        Bookstore
      </NavLink>

      <NavLink to="/books">Books</NavLink>
      <NavLink to="/clubs">Clubs</NavLink>

      {user && (
        <>
          <NavLink to="/reservations">Reservations</NavLink>
          <NavLink to="/lists">Lists</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/chat">Chat</NavLink>

          <span>{user.name}</span>

          <button
            type="button"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            Logout
          </button>
        </>
      )}

      {isBookseller && <NavLink to="/staff/stock">Stock</NavLink>}

      {isAdmin && <NavLink to="/staff/admin">Admin</NavLink>}

      {isModerator && <NavLink to="/agent">Agent</NavLink>}

      {!user && <NavLink to="/login">Login</NavLink>}
    </header>
  );
}

export default function App() {
  const { user } = useMe();

  return (
    <>
      <Header user={user} />

<VerifyBanner user={user} />

<main className="main">
        <Routes>
          <Route
            path="/"
            element={<Placeholder name="Discovery" />}
          />

         <Route
  path="/books"
  element={<Placeholder name="Catalog" />}
/>

<Route
  path="/books/:id"
  element={<Placeholder name="Book detail" />}
/>

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

          <Route
            path="/verify"
            element={<VerifyPage />}
          />

          <Route
            path="/forgot"
            element={<ForgotPage />}
          />

          <Route
            path="/reset"
            element={<ResetPage />}
          />

          <Route
            path="/reservations"
            element={
              <ProtectedRoute>
                <Placeholder name="My reservations" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lists"
            element={
              <ProtectedRoute>
                <Placeholder name="Reading lists" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lists/:id"
            element={
              <ProtectedRoute>
                <Placeholder name="Reading list" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Placeholder name="Settings" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Placeholder name="Book chat" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clubs"
            element={<ClubsPage />}
          />

          <Route
            path="/clubs/:id"
            element={<ClubDetailPage />}
          />

          <Route
            path="/clubs/:id/manage"
            element={<Placeholder name="Moderator console" />}
          />

          <Route
  path="/staff/stock"
  element={<StockPage />}
/>

          <Route
            path="/staff/admin"
            element={<Placeholder name="Admin" />}
          />

          <Route
            path="/agent"
            element={<Placeholder name="Reading agent" />}
          />

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </main>
    </>
  );
}