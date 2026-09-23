const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

let currentLogFile = null;

function startRun() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  currentLogFile = path.join(LOG_DIR, `run-${runId}.jsonl`);
  fs.writeFileSync(currentLogFile, '');
  fs.writeFileSync(path.join(LOG_DIR, 'latest.txt'), currentLogFile);
  return currentLogFile;
}

function log(step, status, message) {
  const entry = { ts: Date.now(), step, status, message };
  if (currentLogFile) {
    fs.appendFileSync(currentLogFile, JSON.stringify(entry) + '\n');
  }

  const icon =
    status === 'ok' ? chalk.green('✅') :
    status === 'fail' ? chalk.red('❌') :
    chalk.yellow('➡️ ');
  const label = chalk.bold(step.toUpperCase().padEnd(12));
  console.log(`${icon} ${label} ${message}`);
}

module.exports = { startRun, log, LOG_DIR };