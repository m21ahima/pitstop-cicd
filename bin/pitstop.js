#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { startRun, LOG_DIR } = require('../lib/logger');
const {
  build, test, deploy, healthcheck, rollback,
  getPreviousState, saveState, killProcess,
} = require('../lib/steps');

async function runDeploy() {
  startRun();
  console.log(chalk.cyan.bold('\n🏁 Pit Stop — starting deploy\n'));

  const previous = getPreviousState();

  if (!build()) return finish(false);
  if (!test()) return finish(false);

  const newInstance = deploy(previous);
  const healthy = await healthcheck(newInstance.port);

  if (!healthy) {
    rollback(newInstance.pid, previous);
    return finish(false);
  }

    if (previous) {
    killProcess(previous.pid);
  }
  saveState(newInstance);
  finish(true, newInstance.port);
}

function finish(success, port) {
  if (success) {
    console.log(chalk.green.bold(`\n✅ Deploy complete — app is live on port ${port}.\n`));
  } else {
    console.log(chalk.red.bold('\n❌ Deploy failed — rolled back, previous version still serving.\n'));
  }
}

function runReplay() {
  const latestPath = path.join(LOG_DIR, 'latest.txt');
  if (!fs.existsSync(latestPath)) {
    console.log(chalk.red('No runs recorded yet. Run `pitstop deploy` first.'));
    return;
  }
  const logFile = fs.readFileSync(latestPath, 'utf8').trim();
  const entries = fs.readFileSync(logFile, 'utf8')
    .trim().split('\n').filter(Boolean).map(JSON.parse);

  console.log(chalk.cyan.bold('\n▶️  Replaying last run...\n'));

  let i = 0;
  function playNext() {
    if (i >= entries.length) {
      console.log(chalk.cyan.bold('\n⏹  Replay finished.\n'));
      return;
    }
    const entry = entries[i];
    const icon =
      entry.status === 'ok' ? chalk.green('✅') :
      entry.status === 'fail' ? chalk.red('❌') :
      chalk.yellow('➡️ ');
    console.log(`${icon} ${chalk.bold(entry.step.toUpperCase().padEnd(12))} ${entry.message}`);

    const next = entries[i + 1];
    const delay = next ? Math.min(next.ts - entry.ts, 1500) : 0;
    i++;
    setTimeout(playNext, delay);
  }

  playNext();
}

const command = process.argv[2];

if (command === 'deploy') {
  runDeploy();
} else if (command === 'replay') {
  runReplay();
} else {
  console.log(`
Usage:
  node bin/pitstop.js deploy   Run build → test → deploy → healthcheck (auto-rollback on failure)
  node bin/pitstop.js replay   Replay the most recent run, step by step
  `);
}