import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestAuth = () => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div>Loading auth...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Auth Context Test</h3>
      <p>Token: {token ? 'Present' : 'Missing'}</p>
      <p>User: {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</p>
    </div>
  );
};

export default TestAuth;