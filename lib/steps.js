const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { log, LOG_DIR } = require('./logger');

const APP_DIR = path.join(__dirname, '..', 'sample-app');
const STATE_FILE = path.join(LOG_DIR, 'current.json');

function build() {
  log('build', 'running', 'Installing dependencies...');
  try {
    execSync('npm install --silent', { cwd: APP_DIR, stdio: 'ignore' });
    log('build', 'ok', 'Dependencies installed.');
    return true;
  } catch (err) {
    log('build', 'fail', 'npm install failed.');
    return false;
  }
}

function test() {
  log('test', 'running', 'Running test suite...');
  try {
    execSync('node test.js', { cwd: APP_DIR, stdio: 'ignore' });
    log('test', 'ok', 'All tests passed.');
    return true;
  } catch (err) {
    log('test', 'fail', 'Tests failed.');
    return false;
  }
}

function getPreviousState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return null;
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function deploy(previousState) {
  const port = previousState && previousState.port === 4000 ? 4001 : 4000;
  log('deploy', 'running', `Starting new instance on port ${port}...`);
  const child = spawn('node', ['index.js'], {
    cwd: APP_DIR,
    env: { ...process.env, PORT: port },
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  log('deploy', 'ok', `New instance started (pid ${child.pid}, port ${port}).`);
  return { pid: child.pid, port };
}

function healthcheck(port, retries = 5) {
  return new Promise((resolve) => {
    let attempt = 0;

    function tryOnce() {
      attempt++;
      log('healthcheck', 'running', `Attempt ${attempt}/${retries}...`);
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          log('healthcheck', 'ok', 'App is healthy.');
          resolve(true);
        } else if (attempt < retries) {
          setTimeout(tryOnce, 1000);
        } else {
          log('healthcheck', 'fail', `Unhealthy after ${retries} attempts.`);
          resolve(false);
        }
      });
      req.on('error', () => {
        if (attempt < retries) {
          setTimeout(tryOnce, 1000);
        } else {
          log('healthcheck', 'fail', `App unreachable after ${retries} attempts.`);
          resolve(false);
        }
      });
    }

    tryOnce();
  });
}

function killProcess(pid) {
  try {
    process.kill(pid);
  } catch (err) {
    // already dead — fine
  }
}

function rollback(newPid, previousState) {
  log('rollback', 'running', 'New version failed healthcheck — rolling back...');
  killProcess(newPid);
  if (previousState) {
    log('rollback', 'ok', `Previous version still live on port ${previousState.port} (pid ${previousState.pid}). No downtime.`);
  } else {
    log('rollback', 'ok', 'No previous version was running — app is now stopped.');
  }
}

module.exports = {
  build, test, deploy, healthcheck, rollback,
  getPreviousState, saveState, killProcess,
};