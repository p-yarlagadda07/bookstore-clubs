import useMe from '../../app/useMe.js';

// a plain link works here because the session cookie is sent with it
export default function SaveTheDate({ clubId, meetingId }) {
  const { user } = useMe();
  if (!user) return null;

  return (
    <a
      className="btn btn-secondary"
      download
      href={`/api/clubs/${clubId}/meetings/${meetingId}/calendar.ics`}
    >
      Save the Date
    </a>
  );
}
