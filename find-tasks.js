const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./TODO.json', 'utf8'));
const pending = data.tasks.filter(t => t.status === 'pending' && !t.assigned_agent);

console.log('Found', pending.length, 'unassigned pending tasks:');

pending.slice(0, 10).forEach((t, i) => {
  console.log(`${i+1}. ${t.id}: ${t.title.substring(0, 60)}...`);
  console.log(`   Category: ${t.category}, Dependencies: ${t.dependencies ? t.dependencies.length : 0}`);
});

if (pending.length > 0) {
  const noDeps = pending.filter(t => !t.dependencies || t.dependencies.length === 0);
  console.log(`\nTasks without dependencies: ${noDeps.length}`);
  noDeps.slice(0, 3).forEach((t, i) => {
    console.log(`${i+1}. ${t.id}: ${t.title.substring(0, 60)}... (${t.category})`);
  });
}