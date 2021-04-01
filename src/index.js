const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checkExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(user => user.username === username);

  if(!user) return response.status(404).json({ error: 'User not found!'});

  request.user = user;

  return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request;

  if(user.pro === true) return next();
  
  if(!user.pro && user.todos.length < 10) {
    return next();
  } else {
    return response.status(403).json({ error: 'Task limit issued, sign the PRO plan' });
  }
  
}

function checksTodoExists(request, response, next) {
  const { id } = request.params;
  const { username } = request.headers;

  const user = users.find(user => user.username === username);
  if(!user) return response.status(404).json({ error: 'User not found' });

  const todo = user.todos.find(user => user.id === id);

  if(!todo) return response.status(404).json({ error: 'Task not found' });
  
  request.todo = todo;

  return next();
}

function findUserById(request, response, next) {
  const { id } = request.params;
  const user = users.find(user => user.id === id);

  if(!user) return response.status(404).json({ error: 'User not found!'});

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { username, name } = request.body;
  const userAlreadyExists = users.some(user => user.username === username);

  if(userAlreadyExists) return response.status(400).json({ error: 'User already exists!' });

  users.push({
    id: uuidv4(),
    username,
    name,
    pro: false,
    todos: []
  });

  return response.status(201).json(users);  
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.status(200).json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) return response.status(400).json({ error: 'Pro plan is already activated.' });

  user.pro = true;

  return response.json(user);
});

app.get('/todos', checkExistsUserAccount, (request, response) => {
  const { user } = request;
  const todos = user.todos;

  return response.status(200).json(todos);
});

app.post('/todos', checkExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const taskAlreadyExists = user.todos.some(task => task.title === title);

  if(taskAlreadyExists) return response.status(400).json({ error: 'Task already exists' });

  const newTask = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(newTask);

  return response.status(201).json(newTask);
});

app.put('/todos/:id', checksTodoExists, (request, response) => {
  const { todo } = request;
  const { title, deadline } = request.body;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(200).json(todo);
});

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.status(200).json(todo);
});

app.delete('/todos/:id', checkExistsUserAccount, checksTodoExists, (request, response) => {
  const { user, todo } = request;

  const todoIndex = user.todos.indexOf(todo);

  if(todoIndex === -1) return response.status(404).json({ error: 'Task not found' });

  user.todos.splice(todoIndex, 1);

  return response.status(200).json({ message: 'Remove task' });
});

app.listen(3333);