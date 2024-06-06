import mongoose from 'mongoose'
import app from './app.js'
import config from './app/config/index.js'
import './app/modules/terminal/terminal.cron.js'

async function main() {
  try {
    await mongoose.connect(config.database_url);
    console.log('Connected to MongoDB');

    const port = config.port || 5001;
    const host = '0.0.0.0'; // Listen on all interfaces
    app.listen(port, host, () => {
      console.log(`App is listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

main()