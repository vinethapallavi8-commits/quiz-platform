import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function AttemptResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/attempts/${id}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading result...</div>;
  if (!data) return <div className="p-8">Result not found.</div>;

  const { attempt, answers } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="w-full max-w-xl">
        <div className="bg-white p-8 rounded-lg shadow-md text-center mb-6">
          <h1 className="text-xl font-bold mb-1">{attempt.quizTitle}</h1>
          <p className={`text-3xl font-bold my-4 ${attempt.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
            {attempt.percentage}%
          </p>
          <p className="mb-4 font-semibold">{attempt.status}</p>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="block text-gray-500">Correct</span>{attempt.correctAnswers}</div>
            <div><span className="block text-gray-500">Incorrect</span>{attempt.incorrectAnswers}</div>
            <div><span className="block text-gray-500">Unanswered</span>{attempt.unanswered}</div>
          </div>
        </div>

        <h2 className="font-semibold mb-3">Answer Review</h2>
        {answers.map((ans) => (
          <div key={ans.id} className="bg-white p-4 rounded-lg shadow mb-3">
            <p className="font-medium mb-2">{ans.questionText}</p>
            <p className={`text-sm ${ans.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              Your answer: {ans.selectedOptionText || 'Not answered'}
            </p>
            {!ans.isCorrect && (
              <p className="text-sm text-green-600">Correct answer: {ans.correctOptionText}</p>
            )}
            {ans.explanation && <p className="text-xs text-gray-500 mt-1">{ans.explanation}</p>}
          </div>
        ))}

        <Link to="/quizzes" className="block text-center text-blue-600 mt-4">Back to quizzes</Link>
      </div>
    </div>
  );
}

export default AttemptResult;