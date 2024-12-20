class RepoChecker {
    constructor() {
        this.repoPathInput = document.getElementById('repoPath');
        this.checkRepoButton = document.getElementById('checkRepo');
        this.repoStatusResult = document.getElementById('repoStatus');
        this.branchSelectors = document.querySelector('.branch-selectors');
        
        this.bindEvents();
    }

    bindEvents() {
        this.checkRepoButton.addEventListener('click', () => this.checkRepo());
    }

    async checkRepo() {
        const repoPath = this.repoPathInput.value;
        if (!repoPath) {
            alert('Please enter a repository path');
            return;
        }

        try {
            const response = await fetch('/check-repo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ repoPath }),
            });

            const result = await response.json();
            this.displayRepoStatus(result);
            this.branchSelectors.style.display = 'block';
            await this.loadBranches(repoPath);
        } catch (error) {
            console.error('Error:', error);
            this.repoStatusResult.textContent = 'Error checking repository: ' + error.message;
        }
    }

    displayRepoStatus(status) {
        this.repoStatusResult.innerHTML = `
            <h3>Repository Status:</h3>
            <p>Current Branch: ${status.currentBranch}</p>
            <p>Modified Files: ${status.modified.join(', ') || 'None'}</p>
            <p>Untracked Files: ${status.untracked.join(', ') || 'None'}</p>
        `;
    }

    async loadBranches(repoPath) {
        try {
            const response = await fetch('/get-branches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ repoPath }),
            });

            const branches = await response.json();
            const branchSelect = document.getElementById('targetBranch');
            branchSelect.innerHTML = '';
            
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading branches:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.repoChecker = new RepoChecker();
});
