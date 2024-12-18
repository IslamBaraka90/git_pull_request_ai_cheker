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

const INCLUDED_EXTENSIONS = ['.php', '.js'];

const SOURCE_CODES_DIR = path.join(__dirname, '..', '..', 'sourcecodes');

module.exports = {
    IGNORED_FOLDERS,
    INCLUDED_EXTENSIONS,
    SOURCE_CODES_DIR
};
