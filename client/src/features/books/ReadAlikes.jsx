import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card } from '../../components/index.js';
import { stockTone } from './stockTone.js';
import { spineColor } from './spine.js';
import api from '../../api/client.js';

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '1rem',
};

export default function ReadAlikes({ bookId }) {
  const { data } = useQuery({
    queryKey: ['similar', bookId],
    queryFn: () => api.get(`/books/${bookId}/similar`, { params: { limit: 4 } }),
    enabled: Boolean(bookId),
  });

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <div className="book-section book-detail-content">
      <h2>Read-Alikes</h2>
      <div style={gridStyle}>
        {items.map((b) => (
          <Card className="card-hover spine" key={b.id} style={{ '--spine': spineColor(b.title) }}>
            <h3>
              <Link to={`/books/${b.id}`}>{b.title}</Link>
            </h3>
            <p>{b.authors?.join(', ')}</p>
            <Badge tone={stockTone(b.availability?.label)}>{b.availability?.label}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
