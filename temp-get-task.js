const TaskManager = require("./lib/taskManager");
const tm = new TaskManager("./TODO.json");

const agentId = "development_session_1756220319714_1_general_e17a8ff8";

tm.getCurrentTask(agentId).then(task => {
    if (task) {
        console.log("Current task details:");
        console.log(JSON.stringify(task, null, 2));
    } else {
        console.log("No current task found");
    }
}).catch(console.error);