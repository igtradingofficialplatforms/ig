
import React, { useCallback, useEffect, useState } from 'react';
import './Monitoring.css';

export default function Monitoring({ supabase }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActivities = useCallback(async () => {
    try {
      setError('');

      const { data: { session }, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('Please sign in again.');
      }

      const response = await fetch('/api/admin-activity', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to load activity.');
      }

      setActivities(result.activities || []);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return (
    <div className="monitoring-container">
      <div className="monitoring-header">
        <div>
          <h2>User Monitoring</h2>
          <p>Recent account activity and page visits</p>
        </div>

        <button
          className="monitoring-refresh"
          onClick={() => {
            setLoading(true);
            loadActivities();
          }}
        >
          Refresh
        </button>
      </div>

      <div className="monitoring-stats">
        <div className="monitoring-stat">
          <span>Total Recorded Events</span>
          <strong>{activities.length}</strong>
        </div>

        <div className="monitoring-stat">
          <span>Login Events</span>
          <strong>
            {activities.filter(item => item.event_type === 'login').length}
          </strong>
        </div>

        <div className="monitoring-stat">
          <span>Page Visits</span>
          <strong>
            {activities.filter(item => item.event_type === 'page_view').length}
          </strong>
        </div>
      </div>

      {loading && <p className="monitoring-message">Loading activity...</p>}

      {error && <p className="monitoring-error">{error}</p>}

      {!loading && !error && (
        <div className="monitoring-table-wrap">
          <table className="monitoring-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>User ID</th>
                <th>Page</th>
                <th>Country</th>
                <th>Device</th>
                <th>Browser</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {activities.map(item => (
                <tr key={item.id}>
                  <td>{item.event_type}</td>
                  <td className="monitoring-user-id">
                    {item.user_id}
                  </td>
                  <td>{item.page_path || '-'}</td>
                  <td>{item.country || 'Unknown'}</td>
                  <td>{item.device || 'Unknown'}</td>
                  <td>{item.browser || 'Unknown'}</td>
                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : '-'}
                  </td>
                </tr>
              ))}

              {activities.length === 0 && (
                <tr>
                  <td colSpan="7">No activity recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
