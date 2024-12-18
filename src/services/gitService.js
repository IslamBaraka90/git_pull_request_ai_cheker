const simpleGit = require('simple-git');

class GitService {
    async getRepoInfo(repoPath) {
        const git = simpleGit(repoPath);
        try {
            const status = await git.status();
            const branch = await git.branch();
            return {
                currentBranch: branch.current,
                isRepo: true,
                modified: status.modified,
                created: status.created,
                deleted: status.deleted,
                renamed: status.renamed
            };
        } catch (error) {
            return {
                isRepo: false,
                error: error.message
            };
        }
    }

    async getBranches(repoPath) {
        const git = simpleGit(repoPath);
        try {
            const branchInfo = await git.branch();
            return {
                all: branchInfo.all,
                current: branchInfo.current
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async compareBranches(repoPath, targetBranch) {
        const git = simpleGit(repoPath);
        try {
            const diff = await git.diff([targetBranch]);
            const summary = await git.diffSummary([targetBranch]);
            return {
                diff: diff,
                summary: {
                    files: summary.files,
                    insertions: summary.insertions,
                    deletions: summary.deletions,
                    changes: summary.changes
                }
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async checkoutBranch(repoPath, branch) {
        const git = simpleGit(repoPath);
        try {
            await git.checkout(branch);
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new GitService();
