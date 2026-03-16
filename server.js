const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// - [ ] **Task 4 — Pagination**
//   Limit the employee table to 5 rows per page. 
//   Add Previous / Next controls and a page indicator. Pagination should work together with search and department filter.
app.get('/api/employees', (req, res) => {
  const { search, department, sort = 'id', order = 'asc', page = 1, limit = 5 } = req.query;

  const allowedSort = ['id', 'name', 'department', 'position', 'hire_date', 'salary'];
  const allowedOrder = ['asc', 'desc'];
  const sortCol = allowedSort.includes(sort) ? sort : 'id';
  const sortOrder = allowedOrder.includes(order) ? order : 'asc';
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND (name LIKE ? OR position LIKE ? OR email LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (department && department !== 'all') {
    where += ' AND department = ?';
    params.push(department);
  }

  const dataQuery = `
    SELECT * FROM employees
    ${where}
    ORDER BY ${sortCol} ${sortOrder.toUpperCase()}
    LIMIT ? OFFSET ?
  `;

  const employees = db.prepare(dataQuery).all(...params, limitNum, offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM employees
    ${where}
  `;

  const { total } = db.prepare(countQuery).get(...params);
  const totalPages = Math.ceil(total / limitNum);
  res.json(
    {
      data: employees,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    }
  );
});

app.get('/api/departments', (req, res) => {
  const departments = db.prepare('SELECT DISTINCT department FROM employees ORDER BY department').all();
  res.json(departments.map(d => d.department));
});

// - [x] **Task 1 — Add Employee**
//   Create an "Add Employee" form that allows submitting a new employee 
//   record to the database via a `POST /api/employees` endpoint.
app.post('/api/employees', (req, res) => {
  const employee = {
    name: req.body.name,
    department: req.body.department,
    position: req.body.position,
    email: req.body.email,
    phone: req.body.phone,
    hire_date: req.body.hire_date,
    salary: req.body.salary
  };
  try {
    const insert = db.prepare(`
      INSERT INTO employees (name, department, position, email, phone, hire_date, salary)
      VALUES (@name, @department, @position, @email, @phone, @hire_date, @salary)
    `);
    const result = insert.run(employee);
    res.status(201).json({
      id: result.lastInsertRowid,
      ...employee
    });
  } catch (err) {
    switch (err.code) {
      case 'SQLITE_CONSTRAINT_UNIQUE':
        return res.status(409).json({
          error: `Unique constraint failed on: ${err.message.split(': ')[1]}`
        });
      case 'SQLITE_CONSTRAINT_NOTNULL':
        return res.status(400).json({
          error: `Not Null constraint failed`
        });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// - [ ] **Task 2 — Edit Employee**
//   Add an "Edit" button on each row that opens a form pre-filled with the employee's current data. 
//   Implement a `PUT /api/employees/:id` endpoint to save changes.
app.put('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  const employee = {
    id,
    name: req.body.name,
    department: req.body.department,
    position: req.body.position,
    email: req.body.email,
    phone: req.body.phone,
    hire_date: req.body.hire_date,
    salary: req.body.salary
  };
  try {
    const update = db.prepare(`
      UPDATE employees
      SET
        name = @name,
        department = @department,
        position = @position,
        email = @email,
        phone = @phone,
        hire_date = @hire_date,
        salary = @salary
      WHERE id = @id
    `);

    const result = update.run(employee);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(200).json(employee);

  } catch (err) {
    switch (err.code) {
      case 'SQLITE_CONSTRAINT_UNIQUE':
        return res.status(409).json({
          error: `Unique constraint failed on: ${err.message.split(': ')[1]}`
        });
      case 'SQLITE_CONSTRAINT_NOTNULL':
        return res.status(400).json({
          error: `Not Null constraint failed`
        });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// - [ ] **Task 3 — Delete Employee**
//   Add a "Delete" button on each row with a confirmation prompt. Implement a `DELETE /api/employees/:id` endpoint to remove the record.
app.delete('/api/employees/:id', (req, res) => {
  const id = req.params.id;
  try {
    const del = db.prepare(`
      DELETE FROM employees WHERE id = ?
    `);

    const result = del.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(204).send();

  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// - [ ] **Task 5 — Department Salary Pie Chart**
//   Add a `GET /api/salary-by-department` endpoint that returns the total salary grouped by department. On the frontend, render a pie chart using only pure HTML5 Canvas (no external chart libraries) that visualises each department's share of the total salary. Display the chart on the employee directory page.
app.get('/api/salary-by-department', (req, res) => {
  res.send("NOT IMPLEMENTED: Salary by Department get GET");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
