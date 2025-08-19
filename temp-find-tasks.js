const TaskManager = require('./lib/taskManager');

async function findAndClaimTask() {
  const tm = new TaskManager('./TODO.json');
  const data = await tm.readTodo();
  const tasks = data.tasks || [];
  
  const unassigned = tasks.filter(t => 
    t.status === 'pending' && 
    (!t.assigned_agent || t.assigned_agent === null || t.assigned_agent === 'null' || t.assigned_agent === 'undefined')
  );
  
  console.log('Unassigned pending tasks:', unassigned.length);
  unassigned.slice(0, 5).forEach((t, i) => {
    console.log(`${i+1}. ${t.id}: ${t.title.substring(0, 50)}...`);
    console.log(`   Category: ${t.category}, Priority: ${t.priority}, Agent: ${t.assigned_agent}`);
  });
  
  if (unassigned.length > 0) {
    console.log('\nAttempting to claim first unassigned task...');
    const firstTask = unassigned[0];
    try {
      const result = await tm.claimTask(firstTask.id, 'development_session_1755643414905_1_general_ee5839f6', firstTask.priority);
      console.log('Claim result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('Claim failed:', error.message);
    }
  }
}

findAndClaimTask();