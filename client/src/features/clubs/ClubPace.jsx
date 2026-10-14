import { useQuery } from '@tanstack/react-query';
import { Card, InkBars } from '../../components/index.js';
import api from '../../api/client.js';

export default function ClubPace({ clubId }) {
  const { data, isError } = useQuery({
    queryKey: ['pace', clubId],
    queryFn: () => api.get(`/clubs/${clubId}/pace`),
    enabled: Boolean(clubId),
    retry: false,
  });

  if (isError || !data) return null;

  return (
    <section className="club-section">
      <Card title="Club Pace">
        <InkBars
          max={data.book.pageCount}
          unit="p"
          target={{
            value: data.targetPage,
            label: `week ${data.weeksIn} target, page ${data.targetPage}`,
          }}
          items={data.members.map((member) => ({
            label: member.name,
            value: member.page,
            tone: member.status === 'behind' ? 'accent' : undefined,
          }))}
        />
        <p>
          Week {data.weeksIn} of {data.totalWeeks}, target page {data.targetPage}
        </p>
        <p>{data.privateCount} members keep their bookmark private</p>
      </Card>
    </section>
  );
}
