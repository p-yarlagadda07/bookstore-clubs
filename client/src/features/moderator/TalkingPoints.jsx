import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge, Button, Card, Spinner } from '../../components/index.js';
import api from '../../api/client.js';

export default function TalkingPoints({ clubId, meetings = [] }) {
  const [meetingId, setMeetingId] = useState('');

  const talkingPoints = useMutation({
    mutationFn: () =>
      api.post(`/clubs/${clubId}/talking-points`, {
        ...(meetingId ? { meetingId } : {}),
      }),
  });

  const result = talkingPoints.data;

  return (
    <Card title="Talking Points">
      <label>
        Meeting
        <select
          value={meetingId}
          onChange={(event) => {
            setMeetingId(event.target.value);
            talkingPoints.reset();
          }}
        >
          <option value="">Where everyone is now</option>
          {meetings.map((meeting) => (
            <option key={meeting.id} value={meeting.id}>
              {new Date(meeting.date).toLocaleDateString()}
              {meeting.location ? ` - ${meeting.location}` : ''}
            </option>
          ))}
        </select>
      </label>

      <Button
        type="button"
        disabled={talkingPoints.isPending}
        onClick={() => talkingPoints.mutate()}
      >
        {talkingPoints.isPending ? 'Thinking...' : 'Get talking points'}
      </Button>

      {talkingPoints.isPending && <Spinner label="Generating questions..." />}

      {talkingPoints.isError && (
        <p role="alert">
          {talkingPoints.error?.message || 'Unable to get talking points. Please try again.'}
        </p>
      )}

      {result && (
        <div>
          <p>Up to chapter {result.chapterLimit}</p>

          <Badge tone="muted">
            {result.source === 'model' ? 'Written from approved excerpts' : "From the book's moods"}
          </Badge>

          <ol>
            {result.questions.map((question, index) => (
              <li key={`${index}-${question}`}>{question}</li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}
