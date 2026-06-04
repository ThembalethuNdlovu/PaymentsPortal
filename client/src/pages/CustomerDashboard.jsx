import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    provider: 'SWIFT',
    recipientName: '',
    recipientBank: '',
    recipientAccountNumber: '',
    swiftCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const userData = localStorage.getItem('customerUser');
    if (!token || !userData) {
      navigate('/customer/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      return 'Amount must be a positive number';
    }
    if (!/^[a-zA-Z\s]{2,50}$/.test(formData.recipientName)) {
      return 'Recipient name must only contain letters and spaces';
    }
    if (!/^[a-zA-Z\s]{2,100}$/.test(formData.recipientBank)) {
      return 'Bank name must only contain letters and spaces';
    }
    if (!/^\d{10,12}$/.test(formData.recipientAccountNumber)) {
      return 'Recipient account number must be 10 to 12 digits';
    }
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(formData.swiftCode)) {
      return 'Invalid SWIFT code format (e.g. ABCDZAJJ or ABCDZAJJXXX)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('customerToken');
      await axios.post('/api/transactions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Payment submitted successfully! It is now pending verification.');
      setFormData({
        amount: '',
        currency: 'USD',
        provider: 'SWIFT',
        recipientName: '',
        recipientBank: '',
        recipientAccountNumber: '',
        swiftCode: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    navigate('/customer/login');
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="portal-header">
          <div>
            <h1>International Payment</h1>
            <p>Welcome, {user?.fullName}</p>
          </div>
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter payment amount"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Currency</label>
            <select name="currency" value={formData.currency} onChange={handleChange}>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="ZAR">ZAR - South African Rand</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>

          <div className="form-group">
            <label>Payment Provider</label>
            <select name="provider" value={formData.provider} onChange={handleChange}>
              <option value="SWIFT">SWIFT</option>
            </select>
          </div>

          <div className="form-group">
            <label>Recipient Full Name</label>
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Enter recipient full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Recipient Bank</label>
            <input
              type="text"
              name="recipientBank"
              value={formData.recipientBank}
              onChange={handleChange}
              placeholder="Enter recipient bank name"
              required
            />
          </div>

          <div className="form-group">
            <label>Recipient Account Number</label>
            <input
              type="text"
              name="recipientAccountNumber"
              value={formData.recipientAccountNumber}
              onChange={handleChange}
              placeholder="Enter recipient account number"
              required
            />
          </div>

          <div className="form-group">
            <label>SWIFT Code</label>
            <input
              type="text"
              name="swiftCode"
              value={formData.swiftCode}
              onChange={handleChange}
              placeholder="e.g. ABCDZAJJXXX"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : '💳 Pay Now'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomerDashboard;