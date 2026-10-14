import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import './shopFloor.css';
import { Badge, Card, EmptyState, InkBars, PageTitle, Spinner } from '../../components/index.js';

function ShopFloorPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchShopFloor() {
      try {
        const response = await api.get('/staff/shop-floor');
        setData(response);
      } catch (err) {
        setError(err.message || 'Could not load the Shop Floor.');
      } finally {
        setLoading(false);
      }
    }

    fetchShopFloor();
  }, []);

  if (loading) {
    return <Spinner label="Opening the shop floor..." />;
  }

  if (error) {
    return <EmptyState title="Shop Floor unavailable" message={error} />;
  }

  const tiles = [
    { label: 'Active holds', value: data.activeHolds ?? 0 },
    { label: 'Pickups today', value: data.pickupsToday ?? 0 },
    { label: 'Sold out', value: data.soldOut ?? 0 },
    { label: 'Alerts waiting', value: data.alertsWaiting ?? 0 },
  ];

  return (
    <section className="shop-floor-page">
      <PageTitle number="07" label="Staff" title="Shop Floor">
        A quick overview of today's shop activity and stock.
      </PageTitle>

      <div className="shop-floor-tiles">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <p>{tile.label}</p>
            <h2>{tile.value}</h2>
          </Card>
        ))}
      </div>

      <Card>
        <h2>Most held books</h2>
        {data.mostHeld?.length ? (
          <InkBars
            items={data.mostHeld.map((book) => ({
              label: book.title,
              value: book.holds,
            }))}
          />
        ) : (
          <EmptyState title="No holds yet" message="Popular held books will appear here." />
        )}
      </Card>

      <Card>
        <div className="shop-floor-section-heading">
          <h2>Low stock</h2>
          <Link to="/staff/stock">Open Stockroom</Link>
        </div>

        {data.lowStock?.length ? (
          <div className="shop-floor-table-wrapper">
            <table className="shop-floor-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Condition</th>
                  <th>Available</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((item) => (
                  <tr key={item.inventoryId}>
                    <td>{item.title || 'Untitled book'}</td>
                    <td>{item.condition}</td>
                    <td>{item.available}</td>
                    <td>{item.total}</td>
                    <td>
                      <Badge tone={item.available === 0 ? 'danger' : 'accent'}>
                        {item.available === 0 ? 'Sold out' : 'Low stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Stock looks good" message="No low-stock items were found." />
        )}
      </Card>
    </section>
  );
}

export default ShopFloorPage;
