import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client.js';
import './moderator.css';

export default function ModeratorConsolePage() {
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState('');

  const [meeting, setMeeting] = useState({
    date: '',
    time: '',
    location: '',
    agenda: '',
  });

  const [rulesText, setRulesText] = useState('');
  const [description, setDescription] = useState('');
  const [pagesPerWeek, setPagesPerWeek] = useState('');

  const loadConsole = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [clubData, membersData] = await Promise.all([
        api.get(`/clubs/${id}`),
        api.get(`/clubs/${id}/members`),
      ]);

      setClub(clubData);
      setMembers(membersData.items ?? []);
      setDescription(clubData.description ?? '');
      setRulesText((clubData.rules ?? []).join('\n'));
    } catch (err) {
      setError(err?.message ?? 'Unable to load the moderator console.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadConsole();
  }, [loadConsole]);

  async function handleRemoveMember(member) {
    const confirmed = window.confirm(
      `Remove ${member.name || member.email || 'this member'} from the club?`,
    );

    if (!confirmed) return;

    try {
      setRemovingId(String(member.id));
      setError('');
      setMessage('');

      await api.delete(`/clubs/${id}/members/${member.id}`);

      setMembers((current) =>
        current.filter((item) => String(item.id) !== String(member.id)),
      );

      setMessage('Member removed successfully.');
    } catch (err) {
      setError(err?.message ?? 'Unable to remove this member.');
    } finally {
      setRemovingId('');
    }
  }

  async function handleScheduleMeeting(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      await api.post(`/clubs/${id}/meetings`, {
        date: meeting.date,
        time: meeting.time,
        location: meeting.location,
        agenda: meeting.agenda,
      });

      setMeeting({
        date: '',
        time: '',
        location: '',
        agenda: '',
      });

      setMessage('Meeting scheduled successfully.');
    } catch (err) {
      setError(err?.message ?? 'Unable to schedule the meeting.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveClub(event) {
    event.preventDefault();

    const rules = rulesText
      .split('\n')
      .map((rule) => rule.trim())
      .filter(Boolean);

    if (rules.length > 10) {
      setError('You can add a maximum of 10 club rules.');
      return;
    }

let pace;

if (pagesPerWeek.trim() !== '') {
  pace = Number(pagesPerWeek);

  if (!Number.isInteger(pace) || pace < 10 || pace > 1000) {
    setError('Reading pace must be between 10 and 1000 pages per week.');
    return;
  }
}

    try {
      setSaving(true);
      setError('');
      setMessage('');

     const updates = {
  description,
  rules,
};

if (pagesPerWeek.trim() !== '') {
  updates.pagesPerWeek = pace;
}

await api.patch(`/clubs/${id}`, updates);

      setMessage('Club details updated successfully.');
      await loadConsole();
    } catch (err) {
      setError(err?.message ?? 'Unable to update club details.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="moderator-page">
        <p>Loading moderator console...</p>
      </section>
    );
  }

  if (!club) {
    return (
      <section className="moderator-page">
        <p role="alert">
          {error || 'Unable to find this club.'}
        </p>
      </section>
    );
  }

  return (
    <section className="moderator-page">
      <header className="moderator-header">
      <h1>Host Desk</h1>
        <p>Manage members, meetings, and reading rules for {club.name}.</p>
      </header>

      {error && (
        <p className="moderator-alert" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="moderator-success" role="status">
          {message}
        </p>
      )}

      <section className="moderator-card">
        <h2>Club Members</h2>
        <p className="moderator-muted">
          {members.length} active {members.length === 1 ? 'member' : 'members'}
        </p>

        {members.length === 0 ? (
          <p>No active members found.</p>
        ) : (
          <div className="moderator-members">
            {members.map((member) => (
              <article className="moderator-member" key={member.id}>
                <div className="moderator-member-info">
                  <strong>{member.name || 'Unnamed member'}</strong>
                  <span>{member.email || 'No email available'}</span>
                </div>

                <button
                  type="button"
                  className="moderator-danger"
                  onClick={() => handleRemoveMember(member)}
                  disabled={removingId === String(member.id)}
                >
                  {removingId === String(member.id)
                    ? 'Removing...'
                    : 'Remove'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="moderator-card">
        <h2>Schedule a Meeting</h2>

        <form onSubmit={handleScheduleMeeting} className="moderator-form">
          <label>
            Date
            <input
              type="date"
              value={meeting.date}
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(event) =>
                setMeeting({ ...meeting, date: event.target.value })
              }
              required
            />
          </label>

          <label>
            Time
            <input
              type="time"
              value={meeting.time}
              onChange={(event) =>
                setMeeting({ ...meeting, time: event.target.value })
              }
              required
            />
          </label>

          <label>
            Location
            <input
              type="text"
              value={meeting.location}
              maxLength={120}
              placeholder="e.g. Library meeting room"
              onChange={(event) =>
                setMeeting({ ...meeting, location: event.target.value })
              }
              required
            />
          </label>

          <label>
            Agenda
            <textarea
              value={meeting.agenda}
              maxLength={500}
              placeholder="What will the club discuss?"
              onChange={(event) =>
                setMeeting({ ...meeting, agenda: event.target.value })
              }
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Schedule Meeting'}
          </button>
        </form>
      </section>

      <section className="moderator-card">
        <h2>Club Rules & Reading Pace</h2>

        <form onSubmit={handleSaveClub} className="moderator-form">
          <label>
            Club Description
            <textarea
              value={description}
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label>
            Club Rules
            <textarea
              value={rulesText}
              placeholder={'Enter one rule per line'}
              onChange={(event) => setRulesText(event.target.value)}
            />
            <span className="moderator-help">
              Enter one rule per line. Maximum 10 rules, 200 characters each.
            </span>
          </label>

          <label>
            Reading Pace (pages per week)
            <input
              type="number"
              min="10"
              max="1000"
              step="1"
              value={pagesPerWeek}
              onChange={(event) => setPagesPerWeek(event.target.value)}
              required
            />
            <span className="moderator-help">
              Enter a value from 10 to 1000.
            </span>
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Club Details'}
          </button>
        </form>
      </section>
    </section>
  );
}