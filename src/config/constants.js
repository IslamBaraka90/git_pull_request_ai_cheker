const path = require('path');

const IGNORED_FOLDERS = [
    'bin',
    'tmp',
    'logs',
    'vendor',
    'vendors',
    'node_modules',
    'cache',
    'temp',
    'build',
    'dist',
    'coverage',
    'tests',
    'test',
    '.git',
    '.github',
    '.idea',
    '.vscode',
    'bower_components',
    'packages',
    'composer',
    'deps',
    'dependencies'
];

const INCLUDED_EXTENSIONS = ['.php'];

const SOURCE_CODES_DIR = path.join(__dirname, '..', '..', 'sourcecodes');

const AI_MODEL = 'gemini-2.0-flash-exp';
const SYSTEM_INSTRUCTION = 'You are a software designer and system architect. Analyze the provided source code context and answer questions about it.';
const FILE_PROCESSING_POLL_INTERVAL = 10000; // 10 seconds

const TASK_POLL_INTERVAL = 5000;  // 5 seconds
const MAX_RETRIES = 3;

const MAX_RESPONSE_LENGTH = 8192;

module.exports = {
    IGNORED_FOLDERS,
    INCLUDED_EXTENSIONS,
    SOURCE_CODES_DIR,
    AI_MODEL,
    SYSTEM_INSTRUCTION,
    FILE_PROCESSING_POLL_INTERVAL,
    TASK_POLL_INTERVAL,
    MAX_RETRIES,
    MAX_RESPONSE_LENGTH
};
