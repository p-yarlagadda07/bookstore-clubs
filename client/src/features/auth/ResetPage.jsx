import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import { Button, Card, Input } from '../../components/index.js';
import './auth.css';

export default function ResetPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This link is missing its token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSending(true);

    try {
      await api.post('/auth/reset', {
        token,
        password,
      });

      setMessage('Password changed');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err?.message || 'Unable to reset your password. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="auth-page">
      <Card>
        <div className="auth-form">
          <h1>Reset password</h1>

          <form onSubmit={handleSubmit}>
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="auth-success" role="status">
                {message}
              </p>
            )}

            <Button type="submit" disabled={sending} data-testid="reset-btn">
              {sending ? 'Changing password...' : 'Change password'}
            </Button>
          </form>

          <div className="auth-links">
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
