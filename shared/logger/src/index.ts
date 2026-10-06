function getCallerLocation() {
  const stack = new Error().stack?.split("\n")[3]; // уровень глубже
  const match = stack?.match(/\((.*):(\d+):(\d+)\)/);
  if (match) {
    const [, file, line] = match;
    return `${file}:${line}`;
  }
  return "unknown";
}

function getTimestamp(): string {
  return new Date().toISOString(); // или new Date().toLocaleString()
}

export const logger = {
  log: (...args: unknown[]) => {
    console.log(
      "\n",
      `[${getTimestamp()}]`,
      ...args,
      "\n",
      `[${getCallerLocation()}]`,
      "\n"
    );
  },
  info: (...args: unknown[]) => {
    console.log(
      "\n",
      `[${getTimestamp()}]`,
      ...args,
      "\n",
      `[${getCallerLocation()}]`,
      "\n"
    );
  },
  warn: (...args: unknown[]) => {
    console.log(
      "\n",
      `[${getTimestamp()}]`,
      ...args,
      "\n",
      `[${getCallerLocation()}]`,
      "\n"
    );
  },
  error: (...args: unknown[]) => {
    console.log(
      "\n",
      `[${getTimestamp()}]`,
      ...args,
      "\n",
      `[${getCallerLocation()}]`,
      "\n"
    );
  },
};

export default logger;
