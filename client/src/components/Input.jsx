import { useId } from 'react';

export default function Input({ label, error, ...props }) {
  const id = useId();

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}