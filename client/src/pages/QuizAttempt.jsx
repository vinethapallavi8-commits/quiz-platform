import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOptionId }
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.post(`/quizzes/${id}/start`)
      .then((res) => {
        setAttemptId(res.data.attemptId);
        setQuiz(res.data.quiz);
        setQuestions(res.data.questions);
        setTimeLeft(res.data.quiz.duration * 60);
      })
      .catch((err) => setError(err.response?.data?.error || 'Could not start quiz'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    const answersArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId: parseInt(questionId),
      selectedOptionId,
    }));

    try {
      const res = await api.post(`/quizzes/${id}/submit`, { attemptId, answers: answersArray });
      navigate(`/attempts/${res.data.result.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
      setSubmitting(false);
    }
  }, [answers, attemptId, id, navigate, submitting]);

  // Timer countdown
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, timeLeft === 0]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectOption = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  if (loading) return <div className="p-8">Starting quiz...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (questions.length === 0) return <div className="p-8">This quiz has no questions yet.</div>;

  const question = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-lg">{quiz.title}</h1>
          <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
            Time Remaining: {formatTime(timeLeft)}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Question {currentIndex + 1} of {questions.length}
        </p>

        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <p className="font-medium mb-4">{question.questionText}</p>

          <div className="space-y-2">
            {question.options.map((opt) => (
              <label
                key={opt.id}
                className={`block border rounded px-4 py-2 cursor-pointer ${
                  answers[question.id] === opt.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answers[question.id] === opt.id}
                  onChange={() => selectOption(question.id, opt.id)}
                  className="mr-2"
                />
                {opt.optionText}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between mb-4">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded text-sm font-medium ${
                answers[q.id]
                  ? 'bg-green-500 text-white'
                  : idx === currentIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuizAttempt;