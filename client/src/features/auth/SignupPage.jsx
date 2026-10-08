import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Button, Card, Input } from '../../components/index.js';
import './auth.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

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
      await api.post('/auth/signup', {
        name,
        email,
        password,
      });

      setSuccess(
        'Account created. Check your email for a verification link.'
      );
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err?.message ||
          'Unable to create your account. Please try again.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="auth-page">
      <Card>
        <div className="auth-form">
          <h1>Create an account</h1>

          <form onSubmit={handleSubmit}>
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />

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
              autoComplete="new-password"
              minLength={8}
              required
            />

            <Input
              label="Confirm password"
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

            {success && (
              <p className="auth-success" role="status">
                {success}
              </p>
            )}

            <Button
              type="submit"
              disabled={sending}
              data-testid="signup-btn"
            >
              {sending ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="auth-links">
            <Link to="/login">Already have an account? Log in</Link>
          </div>
        </div>
      </Card>
    </main>
  );
}