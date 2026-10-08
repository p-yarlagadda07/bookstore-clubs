import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';
import { Button, Card, Input } from '../../components/index.js';
import './auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSending(true);

    try {
      await api.post('/auth/login', {
        email,
        password,
      });

      await queryClient.invalidateQueries({ queryKey: ['me'] });

      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err?.message || 'Unable to log in. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="auth-page">
      <Card>
        <div className="auth-form">
          <h1>Log in</h1>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={sending}
              data-testid="login-btn"
            >
              {sending ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <div className="auth-links">
            <Link to="/forgot">Forgot password?</Link>
            <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </Card>
    </main>
  );
}