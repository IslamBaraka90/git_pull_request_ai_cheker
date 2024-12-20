class DiffHandler {
    constructor(workflow) {
        this.workflow = workflow;
    }

    async viewDifferences() {
        const mainBranch = document.getElementById('mainBranch').value;
        const featureBranch = document.getElementById('featureBranch').value;
        const featureScope = document.getElementById('featureScope').value;

        if (!mainBranch || !featureBranch || !featureScope.trim()) {
            this.workflow.showError('Please select both branches and provide feature scope description');
            return;
        }

        try {
            const result = await this.workflow.makeApiCall('/api/compare-branches', {
                repoPath: this.workflow.state.repoPath,
                targetBranch: featureBranch
            });

            this.displayDiff(result);
            this.workflow.moveToStep(4);
        } catch (error) {
            this.workflow.showError('Error comparing branches: ' + error.message);
        }
    }

    displayDiff(diffResult) {
        const summaryBox = document.getElementById('diffSummary');
        const diffContent = document.getElementById('diffContent');

        // Display summary
        summaryBox.innerHTML = `
            <ul>
                <li>Files changed: ${diffResult.summary.files.length}</li>
                <li>Insertions: ${diffResult.summary.insertions}</li>
                <li>Deletions: ${diffResult.summary.deletions}</li>
            </ul>
        `;

        // Display formatted diff
        diffContent.innerHTML = '';
        diffResult.diff.forEach(file => {
            const fileHeader = document.createElement('div');
            fileHeader.className = 'diff-file-header';
            fileHeader.textContent = `File: ${file.file}`;
            diffContent.appendChild(fileHeader);

            file.hunks.forEach(hunk => {
                const line = document.createElement('div');
                line.className = `diff-line diff-${hunk.type}`;
                
                if (hunk.type === 'addition') {
                    line.textContent = `+ ${hunk.content}`;
                } else if (hunk.type === 'deletion') {
                    line.textContent = `- ${hunk.content}`;
                } else if (hunk.type === 'header') {
                    line.textContent = hunk.content;
                } else {
                    line.textContent = `  ${hunk.content}`;
                }

                if (hunk.lineNumber) {
                    const lineNum = document.createElement('span');
                    lineNum.className = 'line-number';
                    lineNum.textContent = typeof hunk.lineNumber === 'object' 
                        ? `${hunk.lineNumber.old}:${hunk.lineNumber.new} `
                        : `${hunk.lineNumber} `;
                    line.prepend(lineNum);
                }

                diffContent.appendChild(line);
            });
        });
    }
}
