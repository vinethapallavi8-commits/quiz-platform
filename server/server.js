require('dns').setDefaultResultOrder('ipv4first');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('./middleware/auth');

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Quiz Platform API is running');
});

// ===== AUTH ROUTES =====

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO "User" (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'STUDENT', 'ACTIVE']
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM "User" WHERE id = $1', [req.user.id]);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('PROFILE ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CATEGORY ROUTES =====

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Category" ORDER BY id');
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error('GET CATEGORIES ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const result = await pool.query(
      'INSERT INTO "Category" (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('CREATE CATEGORY ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/categories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await pool.query(
      'UPDATE "Category" SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('UPDATE CATEGORY ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM "Category" WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('DELETE CATEGORY ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== QUIZ ROUTES =====

app.get('/api/quizzes', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let showAll = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.role === 'ADMIN') showAll = true;
      } catch (e) {}
    }

    const query = showAll
      ? `SELECT q.*, c.name as "categoryName" FROM "Quiz" q LEFT JOIN "Category" c ON q."categoryId" = c.id ORDER BY q.id`
      : `SELECT q.*, c.name as "categoryName" FROM "Quiz" q LEFT JOIN "Category" c ON q."categoryId" = c.id WHERE q.status = 'PUBLISHED' ORDER BY q.id`;

    const result = await pool.query(query);
    res.json({ success: true, quizzes: result.rows });
  } catch (error) {
    console.error('GET QUIZZES ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT q.*, c.name as "categoryName"
      FROM "Quiz" q
      LEFT JOIN "Category" c ON q."categoryId" = c.id
      WHERE q.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, quiz: result.rows[0] });
  } catch (error) {
    console.error('GET QUIZ ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/quizzes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, categoryId, difficulty, duration, passingScore, maxAttempts } = req.body;

    if (!title || !categoryId || !difficulty || !duration || !passingScore) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO "Quiz" (title, description, "categoryId", difficulty, duration, "passingScore", "maxAttempts", status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description || null, categoryId, difficulty, duration, passingScore, maxAttempts || 1, 'DRAFT']
    );

    res.json({ success: true, quiz: result.rows[0] });
  } catch (error) {
    console.error('CREATE QUIZ ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/quizzes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, difficulty, duration, passingScore, maxAttempts } = req.body;

    const result = await pool.query(
      `UPDATE "Quiz" SET title=$1, description=$2, "categoryId"=$3, difficulty=$4, duration=$5, "passingScore"=$6, "maxAttempts"=$7, "updatedAt"=now()
       WHERE id=$8 RETURNING *`,
      [title, description, categoryId, difficulty, duration, passingScore, maxAttempts, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, quiz: result.rows[0] });
  } catch (error) {
    console.error('UPDATE QUIZ ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/quizzes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM "Quiz" WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    console.error('DELETE QUIZ ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/quizzes/:id/publish', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE "Quiz" SET status = $1, "updatedAt" = now() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, quiz: result.rows[0] });
  } catch (error) {
    console.error('PUBLISH QUIZ ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== QUESTION ROUTES =====

app.get('/api/quizzes/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params;

    const questions = await pool.query(
      'SELECT * FROM "Question" WHERE "quizId" = $1 ORDER BY id',
      [quizId]
    );

    const questionsWithOptions = await Promise.all(
      questions.rows.map(async (q) => {
        const options = await pool.query(
          'SELECT * FROM "Option" WHERE "questionId" = $1 ORDER BY id',
          [q.id]
        );
        return { ...q, options: options.rows };
      })
    );

    res.json({ success: true, questions: questionsWithOptions });
  } catch (error) {
    console.error('GET QUESTIONS ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/quizzes/:quizId/questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionText, marks, explanation, difficulty, options } = req.body;

    if (!questionText || !options || options.length < 2) {
      return res.status(400).json({ success: false, error: 'Question text and at least 2 options are required' });
    }

    const questionResult = await pool.query(
      `INSERT INTO "Question" ("quizId", "questionText", marks, explanation, difficulty)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [quizId, questionText, marks || 1, explanation || null, difficulty || null]
    );

    const question = questionResult.rows[0];

    const insertedOptions = [];
    for (const opt of options) {
      const optResult = await pool.query(
        'INSERT INTO "Option" ("questionId", "optionText", "isCorrect") VALUES ($1, $2, $3) RETURNING *',
        [question.id, opt.optionText, opt.isCorrect || false]
      );
      insertedOptions.push(optResult.rows[0]);
    }

    res.json({ success: true, question: { ...question, options: insertedOptions } });
  } catch (error) {
    console.error('CREATE QUESTION ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, marks, explanation, difficulty } = req.body;

    const result = await pool.query(
      `UPDATE "Question" SET "questionText"=$1, marks=$2, explanation=$3, difficulty=$4 WHERE id=$5 RETURNING *`,
      [questionText, marks, explanation, difficulty, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    res.json({ success: true, question: result.rows[0] });
  } catch (error) {
    console.error('UPDATE QUESTION ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM "Option" WHERE "questionId" = $1', [id]);
    const result = await pool.query('DELETE FROM "Question" WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('DELETE QUESTION ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ATTEMPT ROUTES (quiz-taking, student) =====

// START a quiz attempt
app.post('/api/quizzes/:quizId/start', authMiddleware, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const quizResult = await pool.query('SELECT * FROM "Quiz" WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }
    const quiz = quizResult.rows[0];

    if (quiz.status !== 'PUBLISHED') {
      return res.status(400).json({ success: false, error: 'This quiz is not available' });
    }

    const attemptCountResult = await pool.query(
      'SELECT COUNT(*) FROM "Attempt" WHERE "quizId" = $1 AND "userId" = $2 AND "completedAt" IS NOT NULL',
      [quizId, userId]
    );
    const attemptCount = parseInt(attemptCountResult.rows[0].count);

    if (attemptCount >= quiz.maxAttempts) {
      return res.status(400).json({ success: false, error: 'Maximum attempts reached for this quiz' });
    }

    const attemptResult = await pool.query(
      'INSERT INTO "Attempt" ("quizId", "userId", "startedAt") VALUES ($1, $2, now()) RETURNING *',
      [quizId, userId]
    );
    const attempt = attemptResult.rows[0];

    const questionsResult = await pool.query(
      'SELECT id, "questionText", marks FROM "Question" WHERE "quizId" = $1 ORDER BY id',
      [quizId]
    );

    const questionsWithOptions = await Promise.all(
      questionsResult.rows.map(async (q) => {
        // NOTE: isCorrect is deliberately excluded here - never sent to frontend
        const options = await pool.query(
          'SELECT id, "optionText" FROM "Option" WHERE "questionId" = $1 ORDER BY id',
          [q.id]
        );
        return { ...q, options: options.rows };
      })
    );

    res.json({
      success: true,
      attemptId: attempt.id,
      quiz: { id: quiz.id, title: quiz.title, duration: quiz.duration, passingScore: quiz.passingScore },
      questions: questionsWithOptions,
      startedAt: attempt.startedAt
    });
  } catch (error) {
    console.error('START QUIZ ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SUBMIT a quiz attempt
app.post('/api/quizzes/:quizId/submit', authMiddleware, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { attemptId, answers } = req.body; // answers = [{ questionId, selectedOptionId }]
    const userId = req.user.id;

    const attemptResult = await pool.query(
      'SELECT * FROM "Attempt" WHERE id = $1 AND "userId" = $2 AND "quizId" = $3',
      [attemptId, userId, quizId]
    );
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }
    const attempt = attemptResult.rows[0];

    if (attempt.completedAt) {
      return res.status(400).json({ success: false, error: 'This attempt was already submitted' });
    }

    const quizResult = await pool.query('SELECT * FROM "Quiz" WHERE id = $1', [quizId]);
    const quiz = quizResult.rows[0];

    // Backend validates elapsed time - don't trust frontend timer
    const startedAt = new Date(attempt.startedAt);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    const allowedSeconds = quiz.duration * 60 + 30; // small grace buffer

    const questionsResult = await pool.query('SELECT * FROM "Question" WHERE "quizId" = $1', [quizId]);
    const totalQuestions = questionsResult.rows.length;

    let correctCount = 0;
    let incorrectCount = 0;
    let totalScore = 0;
    const answeredQuestionIds = new Set();

    for (const ans of answers) {
      answeredQuestionIds.add(ans.questionId);

      const question = questionsResult.rows.find(q => q.id === ans.questionId);
      if (!question) continue;

      let isCorrect = false;
      if (ans.selectedOptionId) {
        const optResult = await pool.query(
          'SELECT "isCorrect" FROM "Option" WHERE id = $1 AND "questionId" = $2',
          [ans.selectedOptionId, ans.questionId]
        );
        isCorrect = optResult.rows.length > 0 && optResult.rows[0].isCorrect;
      }

      if (isCorrect) {
        correctCount++;
        totalScore += question.marks;
      } else if (ans.selectedOptionId) {
        incorrectCount++;
      }

      await pool.query(
        'INSERT INTO "Answer" ("attemptId", "questionId", "selectedOptionId", "isCorrect") VALUES ($1, $2, $3, $4)',
        [attemptId, ans.questionId, ans.selectedOptionId || null, isCorrect]
      );
    }

    const unansweredCount = totalQuestions - answeredQuestionIds.size;
    const maxPossibleScore = questionsResult.rows.reduce((sum, q) => sum + q.marks, 0);
    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const status = percentage >= quiz.passingScore ? 'PASSED' : 'FAILED';

    const updatedAttempt = await pool.query(
      `UPDATE "Attempt" SET score=$1, percentage=$2, "correctAnswers"=$3, "incorrectAnswers"=$4, unanswered=$5, "timeTaken"=$6, status=$7, "completedAt"=now()
       WHERE id=$8 RETURNING *`,
      [totalScore, percentage, correctCount, incorrectCount, unansweredCount, elapsedSeconds, status, attemptId]
    );

    res.json({ success: true, result: updatedAttempt.rows[0] });
  } catch (error) {
    console.error('SUBMIT QUIZ ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all attempts for the logged-in student
app.get('/api/attempts', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, q.title as "quizTitle"
      FROM "Attempt" a
      JOIN "Quiz" q ON a."quizId" = q.id
      WHERE a."userId" = $1 AND a."completedAt" IS NOT NULL
      ORDER BY a."completedAt" DESC
    `, [req.user.id]);

    res.json({ success: true, attempts: result.rows });
  } catch (error) {
    console.error('GET ATTEMPTS ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single attempt detail with answer review
app.get('/api/attempts/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const attemptResult = await pool.query(
      'SELECT a.*, q.title as "quizTitle" FROM "Attempt" a JOIN "Quiz" q ON a."quizId" = q.id WHERE a.id = $1 AND a."userId" = $2',
      [id, req.user.id]
    );
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }
    const attempt = attemptResult.rows[0];

    const answersResult = await pool.query(`
      SELECT ans.*, q."questionText", q.explanation,
             opt."optionText" as "selectedOptionText"
      FROM "Answer" ans
      JOIN "Question" q ON ans."questionId" = q.id
      LEFT JOIN "Option" opt ON ans."selectedOptionId" = opt.id
      WHERE ans."attemptId" = $1
    `, [id]);

    const answersWithCorrect = await Promise.all(
      answersResult.rows.map(async (ans) => {
        const correctOptResult = await pool.query(
          'SELECT "optionText" FROM "Option" WHERE "questionId" = $1 AND "isCorrect" = true',
          [ans.questionId]
        );
        return {
          ...ans,
          correctOptionText: correctOptResult.rows[0]?.optionText || null
        };
      })
    );

    res.json({ success: true, attempt, answers: answersWithCorrect });
  } catch (error) {
    console.error('GET ATTEMPT DETAIL ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});