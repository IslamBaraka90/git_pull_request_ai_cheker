class FileBrowser {
    constructor() {
        this.browseFilesButton = document.getElementById('browseFiles');
        this.fileList = document.getElementById('fileList');
        this.fileContent = document.getElementById('fileContent');
        this.currentPath = '';
        
        this.bindEvents();
    }

    bindEvents() {
        this.browseFilesButton.addEventListener('click', () => this.browseFiles());
        this.fileList.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                this.handleFileClick(fileItem);
            }
        });
    }

    async browseFiles() {
        const path = document.getElementById('repoPath').value;
        if (!path) {
            alert('Please enter a repository path');
            return;
        }

        this.currentPath = path;
        await this.loadFiles(path);
    }

    async loadFiles(path) {
        try {
            const response = await fetch('/browse-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path }),
            });

            const files = await response.json();
            this.displayFiles(files);
        } catch (error) {
            console.error('Error loading files:', error);
            this.fileList.innerHTML = 'Error loading files: ' + error.message;
        }
    }

    displayFiles(files) {
        this.fileList.innerHTML = '';
        
        // Add parent directory option if not in root
        if (this.currentPath !== document.getElementById('repoPath').value) {
            const parentItem = document.createElement('div');
            parentItem.className = 'file-item folder';
            parentItem.innerHTML = '<span>../</span>';
            parentItem.dataset.path = path.dirname(this.currentPath);
            this.fileList.appendChild(parentItem);
        }

        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item' + (file.isDirectory ? ' folder' : '');
            fileItem.innerHTML = `
                <span>${file.name}</span>
                ${file.isDirectory ? '<small>(${file.children} items)</small>' : ''}
            `;
            fileItem.dataset.path = file.path;
            fileItem.dataset.type = file.isDirectory ? 'directory' : 'file';
            this.fileList.appendChild(fileItem);
        });
    }

    async handleFileClick(fileItem) {
        const path = fileItem.dataset.path;
        const type = fileItem.dataset.type;

        // Remove selection from other items
        this.fileList.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });
        fileItem.classList.add('selected');

        if (type === 'directory') {
            this.currentPath = path;
            await this.loadFiles(path);
        } else {
            await this.loadFileContent(path);
        }
    }

    async loadFileContent(path) {
        try {
            const response = await fetch('/get-file-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path }),
            });

            const content = await response.json();
            this.fileContent.innerHTML = `<pre>${content}</pre>`;
        } catch (error) {
            console.error('Error loading file content:', error);
            this.fileContent.innerHTML = 'Error loading file content: ' + error.message;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileBrowser = new FileBrowser();
});
