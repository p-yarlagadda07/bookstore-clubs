import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Button, Card, Input } from '../../components/index.js';
import './auth.css';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSending(true);

    try {
      await api.post('/auth/forgot', {
        email,
      });

      setMessage(
        "If that email has an account, we've sent a reset link."
      );
    } catch (err) {
      setError(
        err?.message || 'Unable to process your request. Please try again.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="auth-page">
      <Card>
        <div className="auth-form">
          <h1>Forgot password</h1>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
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

            <Button
              type="submit"
              disabled={sending}
              data-testid="forgot-btn"
            >
              {sending ? 'Sending...' : 'Send reset link'}
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