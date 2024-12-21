class ProjectsHandler {
    constructor() {
        this.projects = [];
        this.currentEditId = null;
        this.baseUrl = window.location.origin; // Get the base URL dynamically
        this.initializeEventListeners();
        this.loadProjects();
    }

    initializeEventListeners() {
        document.getElementById('projectForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('cancelEdit').addEventListener('click', () => this.cancelEdit());
        document.getElementById('repoPath').addEventListener('blur', () => this.validateRepoPath());
        document.getElementById('browseRepo').addEventListener('click', () => this.browseRepository());
    }

    showToast(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}" viewBox="0 0 16 16">
                ${type === 'success' 
                    ? '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>'
                    : '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>'}
            </svg>
            <span class="ms-2">${message}</span>
        `;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async browseRepository() {
        // Note: This is just a simulation as we can't directly access file system
        // In a real implementation, you'd use electron or backend API for this
        const repoPathInput = document.getElementById('repoPath');
        repoPathInput.value = 'C:/Users/example/projects/my-repo';
        this.validateRepoPath();
    }

    async validateRepoPath() {
        const repoPath = document.getElementById('repoPath').value;
        const validationElement = document.getElementById('pathValidation');
        
        if (!repoPath) {
            validationElement.textContent = '';
            return;
        }

        validationElement.innerHTML = '<span class="spinner"></span> Validating...';
        
        try {
            const response = await fetch(`${this.baseUrl}/api/get-branches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoPath })
            });
            
            const result = await response.json();
            
            if (result && result.all && Array.isArray(result.all)) {
                validationElement.className = 'validation-message success';
                validationElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg><span class="ms-2">Repository path is valid (${result.all.length} branches found)</span>';
            } else {
                validationElement.className = 'validation-message error';
                validationElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg><span class="ms-2">Invalid repository path</span>';
            }
        } catch (error) {
            validationElement.className = 'validation-message error';
            validationElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg><span class="ms-2">Error validating path</span>';
            console.error('Error validating repo path:', error);
        }
    }

    loadProjects() {
        const savedProjects = localStorage.getItem('projects');
        this.projects = savedProjects ? JSON.parse(savedProjects) : [];
        this.renderProjects();
    }

    saveProjects() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
        this.showToast('Projects saved successfully');
    }

    renderProjects() {
        const tbody = document.getElementById('projectsList');
        tbody.innerHTML = '';

        if (this.projects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="bi bi-folder2-open mb-3" viewBox="0 0 16 16">
                            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zM2.5 3a.5.5 0 0 0-.5.5V6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3H2.5zM14 7H2v5.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V7z"/>
                        </svg>
                        <p class="mb-0">No projects added yet</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.projects.forEach(project => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${project.name}</strong>
                </td>
                <td>
                    <small class="text-muted">${project.repoPath}</small>
                </td>
                <td>${project.mainLanguage}</td>
                <td>${project.framework || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="projectsHandler.editProject('${project.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="projectsHandler.deleteProject('${project.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: this.currentEditId || crypto.randomUUID(),
            name: document.getElementById('projectName').value,
            repoPath: document.getElementById('repoPath').value,
            mainLanguage: document.getElementById('mainLanguage').value,
            framework: document.getElementById('framework').value,
            aiConsiderations: document.getElementById('aiConsiderations').value,
            aiNotes: document.getElementById('aiNotes').value,
            mainBranch: document.getElementById('mainBranch').value,
            includeFiles: document.getElementById('includeFiles').value
        };

        // Validate repository path before saving
        const validationElement = document.getElementById('pathValidation');
        if (!validationElement.classList.contains('success')) {
            this.showToast('Please ensure the repository path is valid', 'error');
            return;
        }

        if (this.currentEditId) {
            const index = this.projects.findIndex(p => p.id === this.currentEditId);
            if (index !== -1) {
                this.projects[index] = formData;
                this.showToast('Project updated successfully');
            }
        } else {
            this.projects.push(formData);
            this.showToast('Project added successfully');
        }

        this.saveProjects();
        this.renderProjects();
        this.resetForm();
    }

    editProject(id) {
        const project = this.projects.find(p => p.id === id);
        if (!project) return;

        this.currentEditId = id;
        document.getElementById('formTitle').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
            <span class="ms-2">Edit Project</span>
        `;
        document.getElementById('projectName').value = project.name;
        document.getElementById('repoPath').value = project.repoPath;
        document.getElementById('mainLanguage').value = project.mainLanguage;
        document.getElementById('framework').value = project.framework || '';
        document.getElementById('aiConsiderations').value = project.aiConsiderations || '';
        document.getElementById('aiNotes').value = project.aiNotes || '';
        document.getElementById('mainBranch').value = project.mainBranch;
        document.getElementById('includeFiles').value = project.includeFiles || '';
        document.getElementById('cancelEdit').style.display = 'block';
        
        // Scroll to form
        document.querySelector('.card.sticky-top').scrollIntoView({ behavior: 'smooth' });
        
        // Validate the path
        this.validateRepoPath();
    }

    deleteProject(id) {
        if (confirm('Are you sure you want to delete this project?')) {
            this.projects = this.projects.filter(p => p.id !== id);
            this.saveProjects();
            this.renderProjects();
            this.showToast('Project deleted successfully');
        }
    }

    resetForm() {
        document.getElementById('projectForm').reset();
        document.getElementById('formTitle').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            <span class="ms-2">Add New Project</span>
        `;
        document.getElementById('cancelEdit').style.display = 'none';
        document.getElementById('pathValidation').textContent = '';
        this.currentEditId = null;
    }

    cancelEdit() {
        this.resetForm();
        this.showToast('Edit cancelled');
    }
}

const projectsHandler = new ProjectsHandler();
