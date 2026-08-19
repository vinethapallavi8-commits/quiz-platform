import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadCategories = () => {
    api.get('/categories').then((res) => setCategories(res.data.categories));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', { name, description });
      setName('');
      setDescription('');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    loadCategories();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link to="/admin" className="text-sm text-blue-600 mb-4 inline-block">&larr; Back to dashboard</Link>
      <h1 className="text-2xl font-bold mb-6">Manage Categories</h1>

      <form onSubmit={handleAdd} className="bg-white p-5 rounded-lg shadow mb-6 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Category</button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow divide-y">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{cat.name}</p>
              <p className="text-sm text-gray-500">{cat.description}</p>
            </div>
            <button onClick={() => handleDelete(cat.id)} className="text-red-600 text-sm hover:underline">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminCategories;