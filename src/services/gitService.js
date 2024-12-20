const simpleGit = require('simple-git');
const AiService = require('./aiService');
require('dotenv').config();

class GitService {
    constructor() {
        // this.aiService = new AiService(process.env.GEMINI_API_KEY);
    }

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
        try {
            const git = simpleGit(repoPath);

            // Get current branch
            const branchInfo = await git.branch();
            const currentBranch = branchInfo.current;

            // Get diff between branches
            const diffResult = await git.diff([`${currentBranch}..${targetBranch}`, '--stat']);
            const diffDetailResult = await git.diff([`${currentBranch}..${targetBranch}`]);

            // Parse diff stat
            const summary = this.parseDiffStat(diffResult);

            // Parse detailed diff
            const formattedDiff = this.formatDiff(diffDetailResult);

            return {
                summary,
                diff: formattedDiff,
                currentBranch,
                targetBranch
            };
        } catch (error) {
            throw new Error(`Error comparing branches: ${error.message}`);
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

    async getSourceCode(repoPath) {
        const git = simpleGit(repoPath);
        try {
            // Get list of all tracked files
            const files = await git.raw(['ls-files']);
            return files.split('\n').filter(Boolean);
        } catch (error) {
            throw new Error(`Error getting source code: ${error.message}`);
        }
    }

    async isValidRepo(repoPath) {
        try {
            const git = simpleGit(repoPath);
            await git.status();
            return true;
        } catch (error) {
            return false;
        }
    }

    async getCurrentBranch(repoPath) {
        try {
            const git = simpleGit(repoPath);
            const branchInfo = await git.branch();
            return branchInfo.current;
        } catch (error) {
            throw new Error(`Error getting current branch: ${error.message}`);
        }
    }

    parseDiffStat(diffStat) {
        const lines = diffStat.split('\n');
        const files = [];
        let insertions = 0;
        let deletions = 0;

        // Process each line except the last summary line
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line) {
                const [file] = line.split('|');
                if (file) {
                    files.push(file.trim());
                }

                // Extract numbers
                const numbers = line.match(/(\d+) insertion[s]?|\d+ deletion[s]?/g);
                if (numbers) {
                    numbers.forEach(num => {
                        const n = parseInt(num);
                        if (num.includes('insertion')) {
                            insertions += n;
                        } else if (num.includes('deletion')) {
                            deletions += n;
                        }
                    });
                }
            }
        }

        return {
            files,
            insertions,
            deletions
        };
    }

    formatDiff(diff) {
        const lines = diff.split('\n');
        const formattedDiff = [];
        let currentFile = null;
        let currentHunk = [];

        lines.forEach(line => {
            if (line.startsWith('diff --git')) {
                if (currentFile) {
                    formattedDiff.push({
                        file: currentFile,
                        hunks: currentHunk
                    });
                }
                currentFile = line.split(' b/')[1];
                currentHunk = [];
            } else if (line.startsWith('@@')) {
                currentHunk.push({
                    type: 'header',
                    content: line
                });
            } else if (line.startsWith('+')) {
                currentHunk.push({
                    type: 'addition',
                    content: line.substring(1)
                });
            } else if (line.startsWith('-')) {
                currentHunk.push({
                    type: 'deletion',
                    content: line.substring(1)
                });
            } else if (line.trim()) {
                currentHunk.push({
                    type: 'context',
                    content: line
                });
            }
        });

        if (currentFile) {
            formattedDiff.push({
                file: currentFile,
                hunks: currentHunk
            });
        }

        return formattedDiff;
    }
}

module.exports = new GitService();
