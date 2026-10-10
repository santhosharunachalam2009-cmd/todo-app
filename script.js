document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskCategory = document.getElementById('taskCategory');
  const taskDueDate = document.getElementById('taskDueDate');
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const emptyState = document.getElementById('emptyState');

  // Stats Elements
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statCompleted = document.getElementById('statCompleted');

  // State Management
  let tasks = JSON.parse(localStorage.getItem('student_tasks')) || [];
  let currentFilter = 'all';
  let searchQuery = '';

  // Initialize App
  init();

  function init() {
    loadTheme();
    setDefaultDate();
    renderTasks();
    setupEventListeners();
  }

  // Set default due date in form to today
  function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    taskDueDate.value = today;
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Add task
    taskForm.addEventListener('submit', handleAddTask);

    // Search input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderTasks();
    });

    // Filter buttons
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
      });
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Add Task Function
  function handleAddTask(e) {
    e.preventDefault();

    const title = taskInput.value.trim();
    const category = taskCategory.value;
    const dueDate = taskDueDate.value;

    if (!title || !dueDate) return;

    const newTask = {
      id: Date.now().toString(),
      title,
      category,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Reset Form
    taskInput.value = '';
    setDefaultDate();
    taskInput.focus();
  }

  // Toggle Task Completion
  window.toggleTaskStatus = function (id) {
    tasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    saveTasks();
    renderTasks();
  };

  // Delete Task Function
  window.deleteTask = function (id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    renderTasks();
  };

  // Filter & Search Logic
  function getFilteredTasks() {
    return tasks.filter((task) => {
      // Filter by status
      const matchesFilter =
        currentFilter === 'all' ||
        (currentFilter === 'completed' && task.completed) ||
        (currentFilter === 'pending' && !task.completed);

      // Filter by search query (title or category)
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery) ||
        task.category.toLowerCase().includes(searchQuery);

      return matchesFilter && matchesSearch;
    });
  }

  // Render Tasks to DOM
  function renderTasks() {
    const filteredTasks = getFilteredTasks();
    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      filteredTasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        const isOverdue = checkIsOverdue(task.dueDate, task.completed);
        const formattedDate = formatDate(task.dueDate);
        const categoryClass = `badge-${task.category.toLowerCase().replace(' ', '-')}`;

        li.innerHTML = `
          <div class="task-left">
            <div class="checkbox-custom" onclick="toggleTaskStatus('${task.id}')">
              ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
            </div>
            <div class="task-info">
              <span class="task-title">${escapeHTML(task.title)}</span>
              <div class="task-meta">
                <span class="badge ${categoryClass}">${task.category}</span>
                <span class="due-date ${isOverdue ? 'overdue' : ''}">
                  <i class="fa-regular fa-calendar"></i> ${formattedDate} ${isOverdue ? '(Overdue)' : ''}
                </span>
              </div>
            </div>
          </div>
          <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;
        taskList.appendChild(li);
      });
    }

    updateStats();
  }

  // Update Stats Bar
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    statTotal.textContent = `Total: ${total}`;
    statPending.textContent = `Pending: ${pending}`;
    statCompleted.textContent = `Completed: ${completed}`;
  }

  // Dark Mode Toggle Logic
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('student_task_theme', newTheme);

    updateThemeIcon(newTheme);
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem('student_task_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  }

  // Local Storage Save
  function saveTasks() {
    localStorage.setItem('student_tasks', JSON.stringify(tasks));
  }

  // Helper: Format Date string to readable format
  function formatDate(dateStr) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, options);
  }

  // Helper: Check if date is overdue
  function checkIsOverdue(dueDateStr, completed) {
    if (completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    return dueDate < today;
  }

  // Helper: Prevent XSS script injection
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
});