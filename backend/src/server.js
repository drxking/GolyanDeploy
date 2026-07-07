const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

async function start() {
  try {
    await connectDB();
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start API', error);
    process.exit(1);
  }
}

start();
