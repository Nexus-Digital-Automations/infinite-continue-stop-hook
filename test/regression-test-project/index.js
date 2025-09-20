

console.log('Regression test application started');

class RegressionApp {
  constructor() {
    this.version = '1.0.0';
    this.status = 'initialized';
  }

  start() {
    this.status = 'running';
    console.log('Regression app is running');
    return this.status;
  }

  getVersion() {
    return this.version;
  }
}

const app = new RegressionApp();
app.start();
console.log('App version:', app.getVersion());
setTimeout(() => {
  throw new Error('App finished');
}, 200);
