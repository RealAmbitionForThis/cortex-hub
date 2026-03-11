'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FolderOpen, Plus, ChevronDown, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DEFAULT_ACCENT_COLOR } from '@/lib/constants';

export function ProjectSelector({ conversationId, currentProjectId, onProjectChange }) {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', system_prompt: '', icon: '📂', color: DEFAULT_ACCENT_COLOR });

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const currentProject = projects.find(p => p.id === currentProjectId);

  async function handleSelectProject(projectId) {
    // If no conversation yet, just set local state — it'll be applied when the conversation starts
    if (!conversationId) {
      onProjectChange?.(projectId);
      toast.success(projectId ? 'Project selected — will apply to next message' : 'Project removed');
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (res.ok) {
        onProjectChange?.(projectId);
        toast.success(projectId ? 'Project assigned' : 'Project removed');
        setOpen(false);
      }
    } catch {
      toast.error('Failed to update project');
    }
  }

  async function handleCreateProject() {
    if (!newProject.name.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        toast.success('Project created');
        setShowCreate(false);
        setNewProject({ name: '', system_prompt: '', icon: '📂', color: DEFAULT_ACCENT_COLOR });
        await fetchProjects();
      }
    } catch {
      toast.error('Failed to create project');
    }
  }

  async function handleUpdateProject() {
    if (!editProject) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProject),
      });
      if (res.ok) {
        toast.success('Project updated');
        setShowEdit(false);
        setEditProject(null);
        await fetchProjects();
      }
    } catch {
      toast.error('Failed to update project');
    }
  }

  async function handleDeleteProject(id) {
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Project deleted');
        if (currentProjectId === id) onProjectChange?.(null);
        await fetchProjects();
      }
    } catch {
      toast.error('Failed to delete project');
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 h-8">
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline truncate max-w-[100px]">
              {currentProject ? currentProject.name : 'Project'}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start" side="top">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Projects</p>
          <div className="space-y-0.5 max-h-[200px] overflow-auto">
            {/* No project option */}
            <button
              onClick={() => handleSelectProject(null)}
              className={cn(
                'w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
                !currentProjectId && 'bg-accent'
              )}
            >
              <span className="text-muted-foreground">No project</span>
            </button>
            {projects.map((p) => (
              <div key={p.id} className="flex items-center group">
                <button
                  onClick={() => handleSelectProject(p.id)}
                  className={cn(
                    'flex-1 text-left px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors truncate',
                    currentProjectId === p.id && 'bg-accent'
                  )}
                >
                  <span className="mr-1.5">{p.icon}</span>
                  {p.name}
                </button>
                <button
                  onClick={() => { setEditProject({ ...p }); setShowEdit(true); setOpen(false); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDeleteProject(p.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 gap-1 text-xs"
            onClick={() => { setShowCreate(true); setOpen(false); }}
          >
            <Plus className="h-3 w-3" /> New Project
          </Button>
        </PopoverContent>
      </Popover>

      {/* Create Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))}
                placeholder="My Project"
              />
            </div>
            <div>
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={newProject.system_prompt}
                onChange={(e) => setNewProject(p => ({ ...p, system_prompt: e.target.value }))}
                placeholder="Custom instructions for chats in this project..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <div>
                <Label className="text-xs">Icon</Label>
                <Input
                  value={newProject.icon}
                  onChange={(e) => setNewProject(p => ({ ...p, icon: e.target.value }))}
                  className="w-16 text-center"
                />
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={newProject.color}
                  onChange={(e) => setNewProject(p => ({ ...p, color: e.target.value }))}
                  className="w-16 h-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={!newProject.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editProject && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={editProject.name}
                  onChange={(e) => setEditProject(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">System Prompt</Label>
                <Textarea
                  value={editProject.system_prompt || ''}
                  onChange={(e) => setEditProject(p => ({ ...p, system_prompt: e.target.value }))}
                  placeholder="Custom instructions for chats in this project..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <div>
                  <Label className="text-xs">Icon</Label>
                  <Input
                    value={editProject.icon || '📂'}
                    onChange={(e) => setEditProject(p => ({ ...p, icon: e.target.value }))}
                    className="w-16 text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Input
                    type="color"
                    value={editProject.color || DEFAULT_ACCENT_COLOR}
                    onChange={(e) => setEditProject(p => ({ ...p, color: e.target.value }))}
                    className="w-16 h-9"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdateProject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
