import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

function QuizDetails() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((res) => setQuiz(res.data.quiz))
      .catch((err) => setError('Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = () => {
    navigate(`/quizzes/${id}/attempt`);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <Link to="/quizzes" className="text-sm text-blue-600 mb-4 inline-block">&larr; Back to quizzes</Link>

        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-gray-600 mb-6">{quiz.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><span className="text-gray-500">Category:</span> {quiz.categoryName}</div>
          <div><span className="text-gray-500">Difficulty:</span> {quiz.difficulty}</div>
          <div><span className="text-gray-500">Duration:</span> {quiz.duration} minutes</div>
          <div><span className="text-gray-500">Passing Score:</span> {quiz.passingScore}%</div>
          <div><span className="text-gray-500">Max Attempts:</span> {quiz.maxAttempts}</div>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-semibold"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
}

export default QuizDetails;