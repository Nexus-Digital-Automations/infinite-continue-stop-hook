/* eslint-disable no-console -- Test project requires console output for simulation */

console.log('Validation test application started');

// Simulate a simple application
class ValidationApp {
  constructor() {
    this.status = 'initialized';
  }

  start() {
    this.status = 'running';
    console.log('Application is running');
    return this.status;
  }

  stop() {
    this.status = 'stopped';
    console.log('Application stopped');
    return this.status;
  }
}

const app = new ValidationApp();
app.start();
setTimeout(() => {
  app.stop();
  throw new Error('Application finished');
}, 500);
