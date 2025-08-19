const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./TODO.json', 'utf8'));
const problematic = data.tasks.filter(t => t.status === 'in_progress' && !t.started_at);

console.log('Tasks in progress without started_at:', problematic.length);
problematic.forEach(t => {
  console.log(`- ${t.id}: ${t.title.substring(0, 40)}... (Agent: ${t.assigned_agent || 'None'})`);
});

// Check dependency blocking issues
const pendingWithDeps = data.tasks.filter(t => t.status === 'pending' && t.dependencies && t.dependencies.length > 0);
console.log('\nPending tasks blocked by dependencies:', pendingWithDeps.length);
pendingWithDeps.forEach(t => {
  console.log(`- ${t.id}: ${t.title.substring(0, 40)}... (Deps: ${t.dependencies.length})`);
  
  // Check if dependencies exist and their status
  t.dependencies.forEach(depId => {
    const depTask = data.tasks.find(dep => dep.id === depId);
    if (depTask) {
      console.log(`  -> ${depId}: ${depTask.status} (${depTask.title.substring(0, 30)}...)`);
    } else {
      console.log(`  -> ${depId}: NOT FOUND`);
    }
  });
});