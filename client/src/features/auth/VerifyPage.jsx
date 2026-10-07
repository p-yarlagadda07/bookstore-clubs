import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import { Button, Card } from '../../components/index.js';
import './auth.css';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus('error');
        setError('This link is missing its token.');
        return;
      }

      try {
        await api.get('/auth/verify', {
          params: { token },
        });

        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err?.message || 'This verification link is invalid or expired.');
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <main className="auth-page">
      <Card>
        <div className="auth-form">
          <h1>Verify your email</h1>

          {status === 'loading' && <p>Verifying your email...</p>}

          {status === 'success' && (
            <>
              <p className="auth-success">Email verified</p>
              <Link to="/login">
                <Button type="button">Log in</Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="auth-error" role="alert">
                {error}
              </p>

              <Link to="/login">
                <Button type="button">Back to login</Button>
              </Link>
            </>
          )}
        </div>
      </Card>
    </main>
  );
}