"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MemberDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchTasks();
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
        <h1>My Tasks</h1>
        <button onClick={handleLogout} className="btn btn-secondary" style={{width: 'auto', padding: '0.5rem 1rem'}}>Logout</button>
      </nav>

      <div className="container" style={{maxWidth: '800px', paddingTop: '2rem'}}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{margin: 0}}>My Assigned Tasks</h2>
          <select className="form-input" style={{width: 'auto', padding: '0.5rem 2rem 0.5rem 1rem'}} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {tasks.filter(t => filter === 'all' || t.status === filter).length === 0 ? (
          <p className="text-center">No tasks found.</p>
        ) : (
          tasks.filter(t => filter === 'all' || t.status === filter).map(task => (
            <TaskCard key={task._id} task={task} onUpdate={handleUpdateTask} />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onUpdate }) {
  const [newRemark, setNewRemark] = useState("");

  const handleAddRemark = () => {
    if (!newRemark.trim()) return;
    onUpdate(task._id, { newRemark });
    setNewRemark("");
  };

  const toggleStatus = () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    onUpdate(task._id, { status: newStatus });
  };

  const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();

  return (
    <div className="glass-card mb-4" style={isOverdue ? { borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' } : {}}>
      <div className="flex justify-between items-center mb-4">
        <h3 style={isOverdue ? { margin: 0, color: 'var(--danger)' } : { margin: 0 }}>
          {task.title} {isOverdue && <span style={{fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem', color: 'var(--danger)'}}>OVERDUE</span>}
        </h3>
        <span className={`badge ${task.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
          {task.status}
        </span>
      </div>
      <p>{task.description}</p>
      
      <div style={{fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px'}}>
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

      <div style={{marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem'}}>
        {task.remarks && task.remarks.length > 0 && (
          <div style={{marginBottom: '1rem'}}>
            <h4 style={{marginBottom: '0.5rem', color: '#e2e8f0'}}>Remarks History:</h4>
            {task.remarks.map((rmk, idx) => (
              <div key={idx} style={{background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--warning)', marginBottom: '0.5rem'}}>
                <div style={{fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem'}}>{new Date(rmk.date).toLocaleString()}</div>
                <div>{rmk.text}</div>
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Add New Remark</label>
          <div className="flex gap-2" style={{flexDirection: 'column'}}>
            <textarea 
              className="form-input" 
              value={newRemark} 
              onChange={e => setNewRemark(e.target.value)}
              placeholder="Type a new remark here..."
              style={{minHeight: '60px'}}
            />
            <button onClick={handleAddRemark} className="btn btn-primary" style={{padding: '0.5rem'}} disabled={!newRemark.trim()}>Submit Remark</button>
          </div>
        </div>

        <button 
          onClick={toggleStatus} 
          className={`btn ${task.status === 'completed' ? 'btn-secondary' : 'btn-success'} mt-4`}
        >
          {task.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
        </button>
      </div>
    </div>
  );
}
