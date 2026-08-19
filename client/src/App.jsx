import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import QuizList from './pages/QuizList';
import QuizDetails from './pages/QuizDetails';
import QuizAttempt from './pages/QuizAttempt';
import AttemptResult from './pages/AttemptResult';
import AdminDashboard from './pages/AdminDashboard';
import AdminCategories from './pages/AdminCategories';
import AdminQuizzes from './pages/AdminQuizzes';
import AdminQuestions from './pages/AdminQuestions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quizzes/:id" element={<QuizDetails />} />
        <Route path="/quizzes/:id/attempt" element={<QuizAttempt />} />
        <Route path="/attempts/:id" element={<AttemptResult />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/quizzes" element={<AdminQuizzes />} />
        <Route path="/admin/quizzes/:quizId/questions" element={<AdminQuestions />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;