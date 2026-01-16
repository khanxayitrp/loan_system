/// <reference path="../types/log4js-json-layout.d.ts" />
import * as log4js from 'log4js';
import jsonLayout from 'log4js-json-layout';
import fs from 'fs';
import path from 'path';

const getLogFileName = (): string => {
  const now = new Date();
  return `./logs/accting-log-${now.toISOString().slice(0, 10)}.log`;
};

const logDirectory = './logs';
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

log4js.addLayout('json', (config) => (logEvent) => {
  const event = JSON.parse(jsonLayout(config)(logEvent));
  const offset = 7 * 60 * 60 * 1000; 
  const localTime = new Date(new Date(event.startTime).getTime() + offset).toISOString();
  event.startTime = localTime;
  return JSON.stringify(event);
});

log4js.configure({
  appenders: {
    app: {
      type: 'file',
      filename: getLogFileName(),
      layout: {
        type: 'pattern',
        pattern: '[%d] [%p] %c - %m',
      },
      maxLogSize: 1 * 1024 * 1024,
      backups: 10,
    },
    console: {
      type: 'console',
    },
  },
  categories: {
    default: { appenders: ['app', 'console'], level: 'debug' },
  },
});

export const logger = log4js.getLogger();

const daysToKeep = 90;
const cleanOldLogs = (): void => {
  const files = fs.readdirSync(logDirectory);
  const now = Date.now();

  files.forEach(file => {
    if (file.startsWith('accting-log-') && file.endsWith('.log')) {
      const datePart = file.slice(12, 22);
      const fileDate = new Date(datePart);

      if (!isNaN(fileDate.getTime())) {
        const ageInDays = (now - fileDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > daysToKeep) {
          const filePath = path.join(logDirectory, file);
          fs.unlinkSync(filePath);
          logger.info(`Deleted log file 90 days old: ${file}`);
        }
      }
    }
  });
};
// make shecduled task to clean old logs
cleanOldLogs();
