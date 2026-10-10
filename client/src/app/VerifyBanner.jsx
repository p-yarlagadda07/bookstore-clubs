import { Link } from 'react-router-dom';

export default function VerifyBanner({ user }) {
  if (!user || user.emailVerifiedAt) {
    return null;
  }

  return (
    <div className="verify-banner">
      <span>Please verify your email to reserve books.</span>
      <Link to="/verify">Verify email</Link>
    </div>
  );
}
