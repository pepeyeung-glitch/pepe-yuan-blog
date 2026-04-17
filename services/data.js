const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const writeQueues = {};

function getQueue(filePath) {
  if (!writeQueues[filePath]) {
    writeQueues[filePath] = Promise.resolve();
  }
  return writeQueues[filePath];
}

async function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + '.tmp';

  const task = getQueue(filePath).then(async () => {
    const json = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tmpPath, json, 'utf-8');
    await fs.promises.rename(tmpPath, filePath);
  });

  writeQueues[filePath] = task.catch(() => {});
  return task;
}

module.exports = { readJSON, writeJSON };
