// Основной скрипт приложения
document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const taskForm = document.getElementById('taskForm');
    const tasksGrid = document.getElementById('tasksGrid');
    const emptyState = document.getElementById('emptyState');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const priorityOptions = document.querySelectorAll('.priority-option');
    
    // Элементы статистики
    const totalTasksEl = document.getElementById('totalTasks');
    const activeTasksEl = document.getElementById('activeTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const highPriorityTasksEl = document.getElementById('highPriorityTasks');
    
    // Состояние приложения
    let tasks = JSON.parse(localStorage.getItem('plannerTasks')) || [];
    let currentFilter = 'all';
    
    // Инициализация
    initApp();
    
    function initApp() {
        updateStatistics();
        renderTasks();
        setupEventListeners();
        
        // Добавление демо-задач при первом запуске
        if (tasks.length === 0) {
            addDemoTasks();
        }
    }
    
    function setupEventListeners() {
        // Форма добавления задачи
        taskForm.addEventListener('submit', handleAddTask);
        
        // Выбор приоритета
        priorityOptions.forEach(option => {
            option.addEventListener('click', function() {
                priorityOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('taskPriority').value = this.dataset.priority;
            });
        });
        
        // Фильтры
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
            });
        });
        
        // Очистка выполненных задач
        clearCompletedBtn.addEventListener('click', handleClearCompleted);
    }
    
    function handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        
        if (!title) {
            showNotification('Пожалуйста, введите название задачи', true);
            return;
        }
        
        const newTask = {
            id: Date.now().toString(),
            title: title,
            description: description,
            priority: priority,
            completed: false,
            date: new Date().toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            timestamp: Date.now()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStatistics();
        showNotification('Задача успешно добавлена!');
        
        // Сброс формы
        taskForm.reset();
        priorityOptions.forEach(opt => opt.classList.remove('active'));
        document.querySelector('.priority-option[data-priority="medium"]').classList.add('active');
        document.getElementById('taskPriority').value = 'medium';
    }
    
    function handleClearCompleted() {
        const completedTasks = tasks.filter(task => task.completed);
        if (completedTasks.length === 0) {
            showNotification('Нет выполненных задач для очистки', true);
            return;
        }
        
        if (confirm(`Удалить ${completedTasks.length} выполненных задач?`)) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateStatistics();
            showNotification('Выполненные задачи удалены');
        }
    }
    
    function renderTasks() {
        tasksGrid.innerHTML = '';
        
        // Фильтрация задач
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            tasksGrid.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Сортировка: сначала активные, потом по приоритету
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        filteredTasks.forEach((task, index) => {
            const taskElement = createTaskElement(task);
            taskElement.style.animationDelay = `${index * 0.05}s`;
            tasksGrid.appendChild(taskElement);
        });
    }
    
    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item slide-in ${task.completed ? 'completed' : ''}`;
        taskEl.dataset.id = task.id;
        
        // Определение цвета приоритета
        let priorityColor, priorityText;
        switch (task.priority) {
            case 'low':
                priorityColor = 'var(--success)';
                priorityText = 'Низкий';
                break;
            case 'medium':
                priorityColor = 'var(--warning)';
                priorityText = 'Средний';
                break;
            case 'high':
                priorityColor = 'var(--danger)';
                priorityText = 'Высокий';
                break;
        }
        
        taskEl.innerHTML = `
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-priority-badge" style="background: ${priorityColor}20; color: ${priorityColor}">
                    ${priorityText}
                </div>
            </div>
            ${task.description ? `
                <div class="task-description">
                    ${escapeHtml(task.description)}
                </div>
            ` : ''}
            <div class="task-footer">
                <div class="task-date">
                    <i class="far fa-calendar"></i>
                    ${task.date}
                </div>
                <div class="task-actions">
                    <button class="action-btn complete-btn" title="${task.completed ? 'Возобновить' : 'Выполнить'}">
                        <i class="fas ${task.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Обработчики событий
        const completeBtn = taskEl.querySelector('.complete-btn');
        const deleteBtn = taskEl.querySelector('.delete-btn');
        
        completeBtn.addEventListener('click', () => toggleTaskComplete(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        return taskEl;
    }
    
    function toggleTaskComplete(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
            updateStatistics();
            
            const task = tasks[taskIndex];
            showNotification(`Задача "${task.title}" ${task.completed ? 'выполнена' : 'возобновлена'}!`);
        }
    }
    
    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const taskTitle = tasks[taskIndex].title;
            if (confirm(`Удалить задачу "${taskTitle}"?`)) {
                tasks.splice(taskIndex, 1);
                saveTasks();
                renderTasks();
                updateStatistics();
                showNotification(`Задача "${taskTitle}" удалена`);
            }
        }
    }
    
    function updateStatistics() {
        const total = tasks.length;
        const active = tasks.filter(task => !task.completed).length;
        const completed = total - active;
        const highPriority = tasks.filter(task => task.priority === 'high').length;
        
        totalTasksEl.textContent = total;
        activeTasksEl.textContent = active;
        completedTasksEl.textContent = completed;
        highPriorityTasksEl.textContent = highPriority;
    }
    
    function saveTasks() {
        localStorage.setItem('plannerTasks', JSON.stringify(tasks));
    }
    
    function showNotification(message, isError = false) {
        notificationText.textContent = message;
        notification.className = 'notification';
        
        if (isError) {
            notification.classList.add('error');
            notification.querySelector('i').className = 'fas fa-exclamation-circle';
        } else {
            notification.querySelector('i').className = 'fas fa-check-circle';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function addDemoTasks() {
        const demoTasks = [
            {
                id: '1',
                title: 'Запланировать встречу с командой',
                description: 'Обсудить планы на следующий квартал и распределить задачи',
                priority: 'high',
                completed: false,
                date: new Date().toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                timestamp: Date.now() - 86400000
            },
            {
                id: '2',
                title: 'Подготовить отчет по проекту',
                description: 'Собрать все данные и подготовить итоговый отчет',
                priority: 'medium',
                completed: true,
                date: new Date(Date.now() - 172800000).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                timestamp: Date.now() - 172800000
            },
            {
                id: '3',
                title: 'Купить продукты на неделю',
                description: 'Молоко, хлеб, овощи, фрукты, мясо',
                priority: 'low',
                completed: false,
                date: new Date().toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                timestamp: Date.now() - 43200000
            },
            {
                id: '4',
                title: 'Записаться на курс по JavaScript',
                description: 'Изучить продвинутые концепции языка',
                priority: 'medium',
                completed: false,
                date: new Date(Date.now() + 86400000).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                timestamp: Date.now() - 3600000
            }
        ];
        
        tasks = demoTasks;
        saveTasks();
        renderTasks();
        updateStatistics();
    }
});
