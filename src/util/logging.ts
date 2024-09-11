import dayjs from 'dayjs';
import { appendFile } from 'fs';
import { Handler } from 'express';

import {
  ALLOW_EXTRA_WHITE_SPACE_FOR_READABILITY,
  LOGGING_DRIVERS,
  LOG_FILE,
  LOG_FILE_OPTIONS,
  LOG_PREFFIX,
} from './contants';

const getTimeStamp = () => dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss Z');

const logInternal = (err: unknown, drivers: string[]) =>
  log(
    err,
    true,
    'error',
    'LOG',
    drivers.filter((d) => d !== 'file'),
  );

export function log(
  msg: unknown,
  separateFromNext = false,
  severity: 'log' | 'warn' | 'error' = 'log',
  tag = 'act',
  drivers = LOGGING_DRIVERS,
) {
  try {
    const text = `[${getTimeStamp()}] ${LOG_PREFFIX} [${tag.toUpperCase().slice(0, 3)}]: ${String(msg)} ${ALLOW_EXTRA_WHITE_SPACE_FOR_READABILITY && separateFromNext ? '\n\n\n' : ''}`;

    if (drivers.includes('console')) {
      console[severity]?.(text);
    }

    if (drivers.includes('file')) {
      appendFile(LOG_FILE, `${text}\n`, LOG_FILE_OPTIONS, (err) => {
        if (err) {
          logInternal(err, drivers);
        }
      });
    }
  } catch (e) {
    logInternal(e, drivers);
  }
}

export const logger: Handler = (req, _, next) => {
  const { method, path } = req;

  log(`Received "${method}" request to "${path}"`, false, 'log', 'req');
  next();
};
