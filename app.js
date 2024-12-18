const express = require('express');
const bodyParser = require('body-parser');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure sourcecodes directory exists
const sourcecodesDir = path.join(__dirname, 'sourcecodes');
fs.mkdir(sourcecodesDir, { recursive: true }).catch(console.error);

// Git operations
async function getGitInfo(repoPath) {
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

async function compareBranches(repoPath, targetBranch) {
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

async function getBranches(repoPath) {
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

async function getFileContent(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return { content };
    } catch (error) {
        return { error: error.message };
    }
}

async function listFiles(dirPath) {
    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const files = await Promise.all(items.map(async item => {
            const fullPath = path.join(dirPath, item.name);
            const stats = await fs.stat(fullPath);
            return {
                name: item.name,
                path: fullPath,
                isDirectory: item.isDirectory(),
                size: stats.size,
                lastModified: stats.mtime
            };
        }));
        return { files };
    } catch (error) {
        return { error: error.message };
    }
}

// Source code file generation
const IGNORED_FOLDERS = [
    'bin', 'tmp', 'logs', 'vendors', 'node_modules', 'cache', 
    'temp', 'build', 'dist', 'coverage', 'tests'
];

const INCLUDED_EXTENSIONS = ['.php', '.js'];

async function generateSourceCodeFile(repoPath, mainBranch) {
    try {
        const git = simpleGit(repoPath);
        await git.checkout(mainBranch);
        
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '_')
            .replace('T', '_')
            .split('Z')[0];
            
        const repoName = path.basename(repoPath);
        const outputFileName = `${repoName}_${timestamp}.txt`;
        const outputPath = path.join(__dirname, 'sourcecodes', outputFileName);
        
        let fileContent = '';
        
        async function processDirectory(dirPath) {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                const relativePath = path.relative(repoPath, fullPath);
                
                // Skip ignored patterns
                if (item.name.startsWith('.') || 
                    (item.isDirectory() && IGNORED_FOLDERS.includes(item.name.toLowerCase()))) {
                    continue;
                }
                
                if (item.isDirectory()) {
                    await processDirectory(fullPath);
                } else {
                    const ext = path.extname(item.name).toLowerCase();
                    if (!item.name.startsWith('.') && INCLUDED_EXTENSIONS.includes(ext)) {
                        const content = await fs.readFile(fullPath, 'utf8');
                        fileContent += `File Path: ${relativePath}\n`;
                        fileContent += ` File Name: ${item.name}\n`;
                        fileContent += ` File Source Code: ${content}\n\n`;
                    }
                }
            }
        }
        
        await processDirectory(repoPath);
        await fs.writeFile(outputPath, fileContent);
        
        return {
            success: true,
            fileName: outputFileName,
            path: outputPath
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// API endpoints
app.post('/check-repo', async (req, res) => {
    const { repoPath } = req.body;
    const gitInfo = await getGitInfo(repoPath);
    res.json(gitInfo);
});

app.post('/compare-branches', async (req, res) => {
    const { repoPath, targetBranch } = req.body;
    const comparison = await compareBranches(repoPath, targetBranch);
    res.json(comparison);
});

app.post('/get-branches', async (req, res) => {
    const { repoPath } = req.body;
    const branches = await getBranches(repoPath);
    res.json(branches);
});

app.post('/browse-files', async (req, res) => {
    const { path: dirPath } = req.body;
    const result = await listFiles(dirPath);
    res.json(result);
});

app.post('/get-file-content', async (req, res) => {
    const { path: filePath } = req.body;
    const result = await getFileContent(filePath);
    res.json(result);
});

app.post('/generate-source-file', async (req, res) => {
    const { repoPath, mainBranch } = req.body;
    const result = await generateSourceCodeFile(repoPath, mainBranch);
    res.json(result);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Git Checker app listening at http://localhost:${port}`);
});
