"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HeadDashboard() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // New Task State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // New Member State
  const [memberName, setMemberName] = useState("");
  const [memberUsername, setMemberUsername] = useState("");
  const [memberPassword, setMemberPassword] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, membersRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/users")
      ]);

      if (tasksRes.status === 401 || membersRes.status === 401) {
        router.push("/");
        return;
      }

      const tasksData = await tasksRes.json();
      const membersData = await membersRes.json();

      setTasks(tasksData.tasks || []);
      setMembers(membersData.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, assignedTo, dueDate })
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setAssignedTo("");
        setDueDate("");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: memberName, username: memberUsername, password: memberPassword })
      });
      if (res.ok) {
        setMemberName("");
        setMemberUsername("");
        setMemberPassword("");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><div className="loader"></div></div>;

  return (
    <div>
      <nav className="navbar">
        <h1>Head Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary" style={{width: 'auto', padding: '0.5rem 1rem'}}>Logout</button>
      </nav>

      <div className="container" style={{maxWidth: '800px', paddingTop: '2rem'}}>
        
        <div className="glass-card mb-4">
          <h2>Assign New Task</h2>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                <option value="" disabled>Select Member</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.name} (@{m.username})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Assign Task</button>
          </form>
        </div>

        <div className="glass-card mb-4">
          <h2>Create Team Member</h2>
          <form onSubmit={handleCreateMember}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={memberName} onChange={e => setMemberName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-input" value={memberUsername} onChange={e => setMemberUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={memberPassword} onChange={e => setMemberPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-success">Create Member</button>
          </form>
        </div>

        <div className="glass-card mb-4" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{margin: 0}}>Manage Team Members</h2>
          <Link href="/manage-members" className="btn btn-secondary" style={{width: 'auto', padding: '0.5rem 1rem'}}>View All Members</Link>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 style={{margin: 0}}>All Assigned Tasks</h2>
          <select className="form-input" style={{width: 'auto', padding: '0.5rem 2rem 0.5rem 1rem'}} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {tasks.filter(t => filter === 'all' || t.status === filter).length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          tasks.filter(t => filter === 'all' || t.status === filter).map(task => (
            <HeadTaskCard key={task._id} task={task} members={members} onUpdate={fetchData} />
          ))
        )}

      </div>
    </div>
  );
}

function HeadTaskCard({ task, members, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo?._id || "");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, assignedTo, dueDate })
      });
      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    if (!confirm("Are you REALLY sure? This action is permanent and cannot be undone.")) return;
    try {
      const res = await fetch(`/api/tasks/${task._id}`, { method: "DELETE" });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();

  if (isEditing) {
    return (
      <div className="glass-card">
        <h3>Edit Task</h3>
        <div className="form-group mt-4">
          <label className="form-label">Task Title</label>
          <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)}></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select className="form-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
            <option value="" disabled>Select Member</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>{m.name} (@{m.username})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
          <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={isOverdue ? { borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}>
      <div className="flex justify-between items-center mb-4">
        <h3 style={isOverdue ? { margin: 0, color: 'var(--danger)' } : { margin: 0 }}>
          {task.title} {isOverdue && <span style={{fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem', color: 'var(--danger)'}}>OVERDUE</span>}
        </h3>
        <span className={`badge ${task.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
          {task.status}
        </span>
      </div>
      <p>{task.description}</p>
      <div style={{fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px'}}>
        <div><strong>Assigned to:</strong> {task.assignedTo?.name || 'Unknown'}</div>
        <div><strong>Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
        <div><strong>Assigned On:</strong> {new Date(task.createdAt).toLocaleString()}</div>
        {task.editedAt && (
          <div style={{color: 'var(--warning)'}}><strong>Edited On:</strong> {new Date(task.editedAt).toLocaleString()}</div>
        )}
        {task.updatedAt && task.updatedAt !== task.createdAt && task.updatedAt !== task.editedAt && (
          <div><strong>Remark Updated:</strong> {new Date(task.updatedAt).toLocaleString()}</div>
        )}
        {task.status === 'completed' && task.completedAt && (
          <div style={{color: 'var(--accent)'}}><strong>Completed On:</strong> {new Date(task.completedAt).toLocaleString()}</div>
        )}
      </div>
      {task.remarks && task.remarks.length > 0 && (
        <div style={{marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem'}}>
          <h4 style={{marginBottom: '0.5rem', color: '#e2e8f0'}}>Remarks History:</h4>
          {task.remarks.map((rmk, idx) => (
            <div key={idx} style={{background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--warning)', marginBottom: '0.5rem'}}>
              <div style={{fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem'}}>{new Date(rmk.date).toLocaleString()}</div>
              <div>{rmk.text}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2" style={{marginTop: '0.5rem'}}>
        <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{padding: '0.5rem', flex: 1}}>Edit Task</button>
        <button onClick={handleDelete} className="btn btn-danger" style={{padding: '0.5rem', flex: 1}}>Delete</button>
      </div>
    </div>
  );
}

