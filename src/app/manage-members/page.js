"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManageMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setMembers(data.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Link href="/head-dashboard" style={{textDecoration: 'none', color: 'var(--primary)'}}>← Back</Link>
          <h1 style={{margin: 0}}>Manage Members</h1>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{width: 'auto', padding: '0.5rem 1rem'}}>Logout</button>
      </nav>

      <div className="container" style={{maxWidth: '800px', paddingTop: '2rem'}}>
        {members.length === 0 ? (
          <p className="text-center">No members created yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {members.map(member => (
              <MemberCard key={member._id} member={member} onUpdate={fetchMembers} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [username, setUsername] = useState(member.username);
  const [password, setPassword] = useState("");

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${member._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password: password || undefined })
      });
      if (res.ok) {
        setIsEditing(false);
        setPassword(""); // clear password after saving
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete member @${member.username}?`)) return;
    if (!confirm("Are you REALLY sure? This will remove their access completely. Tasks assigned to them will still exist but will be orphaned.")) return;
    try {
      const res = await fetch(`/api/users/${member._id}`, { method: "DELETE" });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isEditing) {
    return (
      <div className="glass-card" style={{padding: '1.5rem', border: '1px solid var(--primary)'}}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">New Password (leave blank to keep current)</label>
          <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="btn btn-primary" style={{padding: '0.5rem', flex: 1}}>Save Member</button>
          <button onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{padding: '0.5rem', flex: 1}}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div>
        <div style={{fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.25rem'}}>{member.name}</div>
        <div style={{fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem'}}>@{member.username}</div>
        <div style={{fontSize: '0.875rem', color: '#94a3b8'}}>Password: ********</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{width: 'auto', padding: '0.5rem 1rem'}}>Edit</button>
        <button onClick={handleDelete} className="btn btn-danger" style={{width: 'auto', padding: '0.5rem 1rem'}}>Delete</button>
      </div>
    </div>
  );
}
