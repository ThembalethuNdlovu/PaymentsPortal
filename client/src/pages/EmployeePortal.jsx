import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function EmployeePortal() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');
    const employeeData = localStorage.getItem('employeeUser');
    if (!token || !employeeData) {
      navigate('/employee/login');
      return;
    }
    setEmployee(JSON.parse(employeeData));
    fetchTransactions(token);
  }, [navigate]);

  const fetchTransactions = async (token) => {
    try {
      const res = await axios.get('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.transactions);
    } catch (err) {
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    setVerifying(id);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('employeeToken');
      await axios.patch(`/api/transactions/${id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Transaction verified successfully!');
      fetchTransactions(token);
    } catch (err) {
      setError('Failed to verify transaction.');
    } finally {
      setVerifying(null);
    }
  };

  const handleSubmitToSwift = async (id) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('employeeToken');
      await axios.patch(`/api/transactions/${id}/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Transaction submitted to SWIFT successfully!');
      fetchTransactions(token);
    } catch (err) {
      setError('Failed to submit to SWIFT.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeUser');
    navigate('/employee/login');
  };

  const pending = transactions.filter(t => t.status === 'Pending').length;
  const verified = transactions.filter(t => t.status === 'Verified').length;
  const submitted = transactions.filter(t => t.status === 'Submitted').length;

  return (
    <div className="page-container" style={{ alignItems: 'flex-start', padding: '40px 20px' }}>
      <div className="card card-wide" style={{ maxWidth: '1100px', width: '100%' }}>

        <div className="portal-header">
          <div>
            <h1>🏦 Employee Payment Portal</h1>
            <p>Welcome, {employee?.fullName} — {employee?.role}</p>
          </div>
          <button className="btn-secondary" onClick={handleLogout}>Logout</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#ff9f0a' }}>{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#34c759' }}>{verified}</div>
            <div className="stat-label">Verified</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#1a73e8' }}>{submitted}</div>
            <div className="stat-label">Submitted to SWIFT</div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading transactions...</p></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><p>No transactions found.</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Recipient</th>
                  <th>Bank</th>
                  <th>SWIFT Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td>{t.customerName || t.customer?.fullName}</td>
                    <td>{t.amount}</td>
                    <td>{t.currency}</td>
                    <td>{t.recipientName}</td>
                    <td>{t.recipientBank}</td>
                    <td>{t.swiftCode}</td>
                    <td>
                      <span className={`badge badge-${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-verify"
                        onClick={() => handleVerify(t._id)}
                        disabled={t.status !== 'Pending' || verifying === t._id}
                      >
                        {verifying === t._id ? '...' : '✓ Verify'}
                      </button>
                      <button
                        className="btn-submit-swift"
                        onClick={() => handleSubmitToSwift(t._id)}
                        disabled={t.status !== 'Verified'}
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                      >
                        Submit to SWIFT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeePortal;