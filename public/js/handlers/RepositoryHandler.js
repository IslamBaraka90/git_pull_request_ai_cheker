class RepositoryHandler {
    constructor(workflow) {
        this.workflow = workflow;
    }

    async checkRepository() {
        const repoPathInput = document.getElementById('projectSelect');
        if (!repoPathInput) {
            console.error('Repository path input not found');
            return;
        }

        const repoPath = repoPathInput.value;
        if (!repoPath) {
            this.workflow.showError('Please enter a repository path');
            return;
        }

        try {
            // Check repository status
            const statusResult = await this.workflow.makeApiCall('/api/check-repo', {
                repoPath: repoPath
            });

            if (statusResult.isRepo) {
                this.workflow.state.repoPath = repoPath;
                this.displayRepoStatus(statusResult);
                
                // Get branches
                const branchResult = await this.workflow.makeApiCall('/api/get-branches', {
                    repoPath: repoPath
                });

                // Update branches dropdown
                this.updateBranchesDropdown('mainBranch', branchResult.all);
                this.updateBranchesDropdown('featureBranch', branchResult.all, branchResult.current);
                
                // Move to next step
                this.workflow.moveToStep(2);
            } else {
                this.workflow.showError('Invalid repository path');
            }
        } catch (error) {
            this.workflow.showError('Error checking repository: ' + error.message);
        }
    }

    displayRepoStatus(status) {
        const statusContent = document.getElementById('statusContent');
        statusContent.innerHTML = `
            <div class="status-item">
                <strong>Repository:</strong> ${status.isRepo ? 'Valid' : 'Invalid'}
            </div>
            <div class="status-item">
                <strong>Current Branch:</strong> ${status.currentBranch}
            </div>
            <div class="status-item">
                <strong>Changes:</strong>
                <ul>
                    ${status.modified.length > 0 ? `<li>Modified: ${status.modified.length} files</li>` : ''}
                    ${status.created.length > 0 ? `<li>Created: ${status.created.length} files</li>` : ''}
                    ${status.deleted.length > 0 ? `<li>Deleted: ${status.deleted.length} files</li>` : ''}
                    ${status.renamed.length > 0 ? `<li>Renamed: ${status.renamed.length} files</li>` : ''}
                    ${status.modified.length === 0 && status.created.length === 0 && 
                      status.deleted.length === 0 && status.renamed.length === 0 ? 
                      '<li>No changes</li>' : ''}
                </ul>
            </div>
        `;
    }

    updateBranchesDropdown(dropdownId, branches, selectedBranch = null) {
        const dropdown = document.getElementById(dropdownId);
        dropdown.innerHTML = ''; // Clear existing options

        // Create and append options for each branch
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            
            // If this is the current branch, select it by default
            if (selectedBranch && branch === selectedBranch) {
                option.selected = true;
            }
            
            dropdown.appendChild(option);
        });
    }
}
