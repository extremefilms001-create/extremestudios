import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Projects() {
  const { userData } = useAuth();
  const showAlert = useAlert();
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', milestoneTitle: '' });
  
  const canManage = ['CEO', 'SECRETARY', 'PRESIDENT', 'PROJECT MANAGER', 'ASS. PROJECT MANAGER', 'CREATIVE MANAGER'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const snap = await getDocs(collection(db, 'projects'));
    setProjects(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!canManage) return showAlert('Unauthorized');
    
    await addDoc(collection(db, 'projects'), {
      name: newProject.name,
      milestones: [{ title: newProject.milestoneTitle, completed: false }],
      createdAt: new Date().toISOString(),
      status: 'Ongoing'
    });
    setNewProject({ name: '', milestoneTitle: '' });
    loadProjects();
  };

  const addMilestone = async (project, title) => {
    if (!canManage) return showAlert('Unauthorized');
    const newMilestones = [...(project.milestones || []), { title, completed: false }];
    await updateDoc(doc(db, 'projects', project.id), { milestones: newMilestones });
    loadProjects();
  };

  const toggleMilestone = async (project, index) => {
    if (!canManage) return showAlert('Unauthorized');
    const newMilestones = [...project.milestones];
    newMilestones[index].completed = !newMilestones[index].completed;
    
    // Auto-update project status if all completed
    const allCompleted = newMilestones.every(m => m.completed);
    
    await updateDoc(doc(db, 'projects', project.id), { 
      milestones: newMilestones,
      status: allCompleted ? 'Completed' : 'Ongoing'
    });
    loadProjects();
  };

  return (
    <div className="admin-projects">
      <div className="admin-page-header">
        <h1 className="text-gradient">Project Tracking</h1>
      </div>

      {canManage && (
        <div className="admin-card">
          <h3>Initiate Project</h3>
          <form onSubmit={handleAddProject} style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
            <input required placeholder="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} style={{flex: 1}} />
            <input required placeholder="First Milestone" value={newProject.milestoneTitle} onChange={e => setNewProject({...newProject, milestoneTitle: e.target.value})} style={{flex: 1}} />
            <button className="btn-primary" type="submit">Create Project</button>
          </form>
        </div>
      )}

      <div className="projects-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem'}}>
        {projects.map(proj => (
          <div key={proj.id} className="admin-card">
            <h3 style={{color: 'var(--color-gold)', margin: 0, display: 'flex', justifyContent: 'space-between'}}>
              {proj.name}
              <span className={`badge ${proj.status === 'Completed' ? 'badge-approved' : 'badge-pending'}`}>{proj.status}</span>
            </h3>
            
            <div style={{marginTop: '1.5rem'}}>
              <h4 style={{fontSize: '0.9rem', color: 'var(--color-white-dim)', marginBottom: '0.5rem'}}>Milestones</h4>
              {proj.milestones?.map((m, idx) => (
                <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                  <input type="checkbox" checked={m.completed} onChange={() => toggleMilestone(proj, idx)} disabled={!canManage} />
                  <span style={{textDecoration: m.completed ? 'line-through' : 'none', color: m.completed ? 'var(--color-white-muted)' : 'var(--color-white)'}}>{m.title}</span>
                </div>
              ))}
              
              {canManage && (
                <button 
                  className="btn-secondary" 
                  style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginTop: '1rem'}}
                  onClick={() => {
                    const title = prompt('Enter Milestone Title:');
                    if (title) addMilestone(proj, title);
                  }}
                >
                  + Add Milestone
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
