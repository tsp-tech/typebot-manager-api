export const EVOLUTION_API_TOKEN = '';
export const PORT = process.env.PORT || 8083;
export const LOG_FILE = process.env.LOG_FILE || './log.txt';
export const LOG_PREFFIX = process.env.LOG_PREFFIX || '[Typebot manager]';
export const LOG_FILE_OPTIONS = { encoding: 'latin1' as BufferEncoding, mode: 0o666, flag: 'a' };
export const LOGGING_DRIVERS = process.env.LOGGING_DRIVERS?.split('|') || ['console'];

export const ALLOW_EXTRA_WHITE_SPACE_FOR_READABILITY =
  process.env.ALLOW_EXTRA_WHITE_SPACE_FOR_READABILITY === String(true);
