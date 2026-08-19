import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function AdminQuestions() {
  const { quizId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState([
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
  ]);
  const [error, setError] = useState('');

  const loadQuestions = () => {
    api.get(`/quizzes/${quizId}/questions`).then((res) => setQuestions(res.data.questions));
  };

  useEffect(() => {
    loadQuestions();
  }, [quizId]);

  const handleOptionChange = (index, field, value) => {
    const updated = [...options];
    if (field === 'isCorrect') {
      updated.forEach((opt, i) => (opt.isCorrect = i === index));
    } else {
      updated[index][field] = value;
    }
    setOptions(updated);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (options.some((o) => !o.optionText.trim())) {
      setError('All 4 options must be filled in');
      return;
    }

    try {
      await api.post(`/quizzes/${quizId}/questions`, {
        questionText, marks: Number(marks), explanation, options
      });
      setQuestionText('');
      setMarks(1);
      setExplanation('');
      setOptions([
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ]);
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add question');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    await api.delete(`/questions/${id}`);
    loadQuestions();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link to="/admin/quizzes" className="text-sm text-blue-600 mb-4 inline-block">&larr; Back to quizzes</Link>
      <h1 className="text-2xl font-bold mb-6">Manage Questions</h1>

      <form onSubmit={handleAdd} className="bg-white p-5 rounded-lg shadow mb-6">
        <input
          placeholder="Question text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3"
          required
        />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="number"
            placeholder="Marks"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Explanation (optional)"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <p className="text-sm text-gray-600 mb-2">Options (select the correct one):</p>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <input
              type="radio"
              name="correctOption"
              checked={opt.isCorrect}
              onChange={() => handleOptionChange(idx, 'isCorrect', true)}
            />
            <input
              placeholder={`Option ${idx + 1}`}
              value={opt.optionText}
              onChange={(e) => handleOptionChange(idx, 'optionText', e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
          </div>
        ))}

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-2">
          Add Question
        </button>
      </form>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <p className="font-medium">{idx + 1}. {q.questionText}</p>
              <button onClick={() => handleDelete(q.id)} className="text-red-600 text-sm hover:underline">
                Delete
              </button>
            </div>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              {q.options.map((opt) => (
                <li key={opt.id} className={opt.isCorrect ? 'text-green-600 font-medium' : ''}>
                  {opt.optionText} {opt.isCorrect && '✓'}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminQuestions;