const fs = require('fs').promises;
const path = require('path');
const { IGNORED_FOLDERS, INCLUDED_EXTENSIONS, SOURCE_CODES_DIR } = require('../config/constants');

class FileService {
    constructor() {
        this.ensureSourceCodesDir();
    }

    async ensureSourceCodesDir() {
        try {
            await fs.mkdir(SOURCE_CODES_DIR, { recursive: true });
        } catch (error) {
            console.error('Error creating sourcecodes directory:', error);
        }
    }

    async listFiles(dirPath) {
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

    async getFileContent(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return { content };
        } catch (error) {
            return { error: error.message };
        }
    }

    async generateSourceCodeFile(repoPath, mainBranch) {
        try {
            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '_')
                .replace('T', '_')
                .split('Z')[0];
                
            const repoName = path.basename(repoPath);
            const outputFileName = `${repoName}_${timestamp}.txt`;
            const outputPath = path.join(SOURCE_CODES_DIR, outputFileName);
            
            let fileContent = '';
            
            async function processDirectory(dirPath) {
                const items = await fs.readdir(dirPath, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dirPath, item.name);
                    const relativePath = path.relative(repoPath, fullPath);
                    const lowerName = item.name.toLowerCase();

                    // Skip ignored patterns
                    if (item.name.startsWith('.') || 
                        (item.isDirectory() && IGNORED_FOLDERS.some(folder => 
                            lowerName === folder.toLowerCase() || 
                            lowerName.includes('vendor') ||
                            lowerName.includes('dependencies') ||
                            lowerName.includes('packages')
                        ))) {
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
}

module.exports = new FileService();
