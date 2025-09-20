
console.log('Performance test application started');

// Simulate some work
function performWork() {
  const start = Date.now();
  let result = 0;

  // CPU-intensive operation
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }

  const duration = Date.now() - start;
  console.log(`Work completed in ${duration}ms, result: ${result}`);
  return result;
}

// Simulate memory usage
function allocateMemory() {
  const arrays = [];
  for (let i = 0; i < 100; i++) {
    arrays.push(new Array(10000).fill(Math.random()));
  }
  return arrays.length;
}

performWork();
const memAlloc = allocateMemory();
console.log(`Memory allocated: ${memAlloc} arrays`);

setTimeout(() => {
  console.log('Application completed successfully');
  process.exit(0);
}, 1000);
