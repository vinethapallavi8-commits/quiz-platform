import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', difficulty: 'Easy',
    duration: 10, passingScore: 60, maxAttempts: 1
  });
  const [error, setError] = useState('');

  const loadData = () => {
    api.get('/quizzes').then((res) => setQuizzes(res.data.quizzes));
    api.get('/categories').then((res) => setCategories(res.data.categories));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/quizzes', form);
      setForm({ title: '', description: '', categoryId: '', difficulty: 'Easy', duration: 10, passingScore: 60, maxAttempts: 1 });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    }
  };

  const togglePublish = async (quiz) => {
    const newStatus = quiz.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await api.patch(`/quizzes/${quiz.id}/publish`, { status: newStatus });
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    await api.delete(`/quizzes/${id}`);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link to="/admin" className="text-sm text-blue-600 mb-4 inline-block">&larr; Back to dashboard</Link>
      <h1 className="text-2xl font-bold mb-6">Manage Quizzes</h1>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-lg shadow mb-6 grid grid-cols-2 gap-3">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} className="border rounded px-3 py-2" required />
        <select name="categoryId" value={form.categoryId} onChange={handleChange} className="border rounded px-3 py-2" required>
          <option value="">Select Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border rounded px-3 py-2 col-span-2" />
        <select name="difficulty" value={form.difficulty} onChange={handleChange} className="border rounded px-3 py-2">
          <option>Easy</option>
          <option>Intermediate</option>
          <option>Hard</option>
        </select>
        <input name="duration" type="number" placeholder="Duration (min)" value={form.duration} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="passingScore" type="number" placeholder="Passing Score %" value={form.passingScore} onChange={handleChange} className="border rounded px-3 py-2" required />
        <input name="maxAttempts" type="number" placeholder="Max Attempts" value={form.maxAttempts} onChange={handleChange} className="border rounded px-3 py-2" required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded col-span-2">Create Quiz</button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow divide-y">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{quiz.title} <span className="text-xs text-gray-400">({quiz.status})</span></p>
              <p className="text-sm text-gray-500">{quiz.categoryName} • {quiz.difficulty} • {quiz.duration} min</p>
            </div>
            <div className="flex gap-3">
              <Link to={`/admin/quizzes/${quiz.id}/questions`} className="text-blue-600 text-sm hover:underline">
                Questions
              </Link>
              <button onClick={() => togglePublish(quiz)} className="text-green-600 text-sm hover:underline">
                {quiz.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => handleDelete(quiz.id)} className="text-red-600 text-sm hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminQuizzes;