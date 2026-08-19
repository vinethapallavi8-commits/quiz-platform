import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories));
    // Admin should see all quizzes, not just published - we'll fetch all via a small trick for now
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hi, {user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg shadow border">
          <p className="text-gray-500 text-sm">Total Categories</p>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link to="/admin/categories" className="bg-blue-600 text-white px-5 py-3 rounded hover:bg-blue-700">
          Manage Categories
        </Link>
        <Link to="/admin/quizzes" className="bg-blue-600 text-white px-5 py-3 rounded hover:bg-blue-700">
          Manage Quizzes
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;