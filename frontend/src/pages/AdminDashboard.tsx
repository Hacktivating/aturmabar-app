import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, LogOut, Key, ShieldAlert } from 'lucide-react';
import api from '../api/axios';

interface Account {
  id: number;
  username: string;
  email: string;
  isVerified: boolean;
  communities: any[];
}

export default function AdminDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/admin/accounts');
      setAccounts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOverridePassword = async (userId: number) => {
    const newPassword = prompt('Enter new password for this account (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      await api.patch(`/admin/accounts/${userId}/password`, { newPassword });
      alert('Password successfully overridden.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to override password.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-md flex items-center justify-center">
            <ShieldAlert className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">AturMabar <span className="text-blue-600">Admin</span></span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 font-medium px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Community Accounts</h1>
        
        {loading ? (
          <p>Loading accounts data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Username</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-medium">{account.username}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{account.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${account.isVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {account.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleOverridePassword(account.id)}
                        className="flex items-center gap-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded transition-colors"
                      >
                        <Key size={14} />
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">No community accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}