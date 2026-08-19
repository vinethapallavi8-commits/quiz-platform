import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    api.get('/quizzes')
      .then((res) => setQuizzes(res.data.quizzes))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div className="p-8">Loading quizzes...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Quizzes</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hi, {user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-gray-500">No quizzes available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white p-5 rounded-lg shadow border">
              <h2 className="font-semibold text-lg mb-1">{quiz.title}</h2>
              <p className="text-sm text-gray-500 mb-3">{quiz.description}</p>
              <div className="flex flex-wrap gap-2 text-xs mb-4">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{quiz.categoryName}</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{quiz.difficulty}</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{quiz.duration} min</span>
              </div>
              <Link
                to={`/quizzes/${quiz.id}`}
                className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuizList;