import app from './app';
import { env } from './config/env';
import logger from './utils/logger';
import { startReminderScheduler } from './jobs/reminderScheduler';

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`Hintro API server started`, {
    port: PORT,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  // Start the reminder cron job
  startReminderScheduler();
});
