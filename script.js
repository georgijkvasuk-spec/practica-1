document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('addTaskForm');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskPriorityInput = document.getElementById('taskPriority');
    const tasksList = document.getElementById('tasksList');
    const taskCount = document.getElementById('taskCount');
    const emptyState = document.getElementById('emptyState');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    function updateTaskCount() {
        const count = tasks.length;
        taskCount.textContent = `${count} ${getTaskWordForm(count)}`;
        
        if (count === 0) {
            emptyState.style.display = 'block';
            clearAllBtn.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            clearAllBtn.style.display = 'inline-flex';
        }
        
        saveTasksToLocalStorage();
    }
    
    function getTaskWordForm(count) {
        if (count % 10 === 1 && count % 100 !== 11) {
            return 'задача';
        } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
            return 'задачи';
        } else {
            return 'задач';
        }
    }
    
    function getPriorityText(priority) {
        const priorities = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий'
        };
        return priorities[priority] || 'Средний';
    }
    
    function getPriorityClass(priority) {
        return `priority-${priority}`;
    }
    
    function renderTasks() {
        tasksList.innerHTML = '';
        
        if (tasks.length === 0) {
            tasksList.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }
        
        tasks.forEach((task, index) => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card ${getPriorityClass(task.priority)}`;
            taskCard.innerHTML = `
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <span class="task-priority ${getPriorityClass(task.priority)}">
                        ${getPriorityText(task.priority)}
                    </span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-actions">
                    <button class="btn btn-danger" data-index="${index}">
                        🗑️ Удалить
                    </button>
                </div>
            `;
            
            tasksList.appendChild(taskCard);
        });
        
        document.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteTask(index);
            });
        });
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function addTask(title, description, priority) {
        const newTask = {
            title: title,
            description: description,
            priority: priority,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        updateTaskCount();
        renderTasks();
        showNotification('Задача успешно добавлена!', 'success');
    }
    
    function deleteTask(index) {
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
            const taskTitle = tasks[index].title;
            tasks.splice(index, 1);
            updateTaskCount();
            renderTasks();
            showNotification(`Задача "${taskTitle}" удалена`, 'info');
        }
    }
    
    function clearAllTasks() {
        if (tasks.length === 0) {
            showNotification('Нет задач для очистки', 'info');
            return;
        }
        
        if (confirm(`Вы уверены, что хотите удалить все задачи (${tasks.length})?`)) {
            tasks = [];
            updateTaskCount();
            renderTasks();
            showNotification('Все задачи удалены', 'info');
        }
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    function saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    addTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const priority = taskPriorityInput.value;
        
        if (!title) {
            showNotification('Пожалуйста, введите название задачи', 'error');
            taskTitleInput.focus();
            return;
        }
        
        addTask(title, description, priority);
        
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        taskPriorityInput.value = 'medium';
        taskTitleInput.focus();
    });
    
    clearAllBtn.addEventListener('click', clearAllTasks);
    
    updateTaskCount();
    renderTasks();
});
