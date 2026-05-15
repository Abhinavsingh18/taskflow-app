const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://abhinav2003singh16_db_user:RgV97kyDlPr1qGrb@task.rfza7hh.mongodb.net/taskdb?appName=task";

async function checkTasks() {
  await mongoose.connect(MONGODB_URI);
  
  const TaskSchema = new mongoose.Schema({}, { strict: false });
  const Task = mongoose.model('Task', TaskSchema);
  
  const tasks = await Task.find().sort({ createdAt: -1 }).limit(3);
  console.log(JSON.stringify(tasks, null, 2));
  
  process.exit(0);
}

checkTasks();
