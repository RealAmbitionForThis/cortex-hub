'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileUpload } from '@/components/shared/FileUpload';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  FolderOpen, Plus, Pencil, Trash2, MessageSquare, FileText, Upload,
  X, Save, ChevronRight, ScrollText, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectChats, setProjectChats] = useState([]);
  const [projectDocs, setProjectDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', system_prompt: '', icon: '📂', color: '#6366f1' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      toast.error('Failed to load projects');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function selectProject(project) {
    setSelectedProject(project);
    setEditing(false);
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setProjectChats(data.conversations || []);
        setProjectDocs(data.documents || []);
      }
    } catch {
      toast.error('Failed to load project details');
    }
  }

  async function handleCreate() {
    if (!newProject.name.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Project created');
        setShowCreate(false);
        setNewProject({ name: '', system_prompt: '', icon: '📂', color: '#6366f1' });
        await fetchProjects();
        // Auto-select new project
        const newP = { ...newProject, id: data.id };
        selectProject(newP);
      }
    } catch {
      toast.error('Failed to create project');
    }
  }

  async function handleSaveEdit() {
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProject.id, ...editForm }),
      });
      if (res.ok) {
        toast.success('Project updated');
        setEditing(false);
        const updated = { ...selectedProject, ...editForm };
        setSelectedProject(updated);
        await fetchProjects();
      }
    } catch {
      toast.error('Failed to update');
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Project deleted');
        if (selectedProject?.id === id) {
          setSelectedProject(null);
          setProjectChats([]);
          setProjectDocs([]);
        }
        await fetchProjects();
      }
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function handleFileUpload(files) {
    if (!selectedProject) return;
    setUploading(true);
    try {
      for (const file of files) {
        // Upload the file to storage
        const uploadForm = new FormData();
        uploadForm.append('files', file);
        uploadForm.append('category', `projects/${selectedProject.id}`);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
        if (!uploadRes.ok) { toast.error(`Failed to upload ${file.name}`); continue; }

        // Create document record and index it
        const docForm = new FormData();
        docForm.append('file', file);
        docForm.append('title', file.name);
        const docRes = await fetch('/api/documents', { method: 'POST', body: docForm });
        if (!docRes.ok) { toast.error(`Failed to index ${file.name}`); continue; }
        const docData = await docRes.json();

        // Link document to project
        await fetch(`/api/projects/${selectedProject.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_id: docData.id }),
        });
      }
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`);
      // Refresh docs
      selectProject(selectedProject);
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
  }

  async function handleRemoveDoc(docId) {
    try {
      await fetch(`/api/projects/${selectedProject.id}/documents?document_id=${docId}`, { method: 'DELETE' });
      setProjectDocs(prev => prev.filter(d => d.id !== docId));
      toast.success('Document removed from project');
    } catch {
      toast.error('Failed to remove document');
    }
  }

  async function handleAddContext(text) {
    if (!selectedProject || !text.trim()) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Context: ${text.slice(0, 50)}`, content: text, type: 'text' }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetch(`/api/projects/${selectedProject.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_id: data.id }),
        });
        toast.success('Context added');
        selectProject(selectedProject);
      }
    } catch {
      toast.error('Failed to add context');
    }
  }

  if (loading) return <AppShell title="Projects"><LoadingSpinner /></AppShell>;

  return (
    <AppShell title="Projects">
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Projects</h1>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Project List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold">All Projects</h2>
            {projects.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No projects yet. Create one to get started.
                </CardContent>
              </Card>
            ) : (
              projects.map(p => (
                <Card
                  key={p.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:border-primary',
                    selectedProject?.id === p.id && 'border-primary'
                  )}
                  onClick={() => selectProject(p)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span>{p.icon || '📂'}</span>
                        {p.name}
                      </CardTitle>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {p.system_prompt && (
                      <CardDescription className="text-xs truncate">{p.system_prompt}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(p.updated_at || p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Right: Project Detail */}
          <div className="lg:col-span-2 space-y-4">
            {selectedProject ? (
              <>
                {/* Project Header & System Prompt */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{selectedProject.icon || '📂'}</span>
                        {editing ? (
                          <Input
                            value={editForm.name ?? selectedProject.name}
                            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="text-lg font-bold h-8"
                          />
                        ) : (
                          selectedProject.name
                        )}
                      </CardTitle>
                      <div className="flex gap-1">
                        {editing ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="h-3.5 w-3.5 mr-1" /> Save
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => { setEditing(true); setEditForm({ name: selectedProject.name, system_prompt: selectedProject.system_prompt || '', icon: selectedProject.icon || '📂', color: selectedProject.color || '#6366f1' }); }}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <ScrollText className="h-3 w-3" /> System Prompt
                      </Label>
                      {editing ? (
                        <Textarea
                          value={editForm.system_prompt ?? ''}
                          onChange={(e) => setEditForm(f => ({ ...f, system_prompt: e.target.value }))}
                          placeholder="Instructions for AI in all chats under this project..."
                          rows={6}
                          className="mt-1 text-sm"
                        />
                      ) : (
                        <div className="mt-1 text-sm bg-muted/50 rounded-md p-3 min-h-[60px] whitespace-pre-wrap">
                          {selectedProject.system_prompt || <span className="text-muted-foreground italic">No system prompt set. Click Edit to add one.</span>}
                        </div>
                      )}
                    </div>
                    {editing && (
                      <div className="flex gap-3">
                        <div>
                          <Label className="text-xs">Icon</Label>
                          <Input
                            value={editForm.icon ?? '📂'}
                            onChange={(e) => setEditForm(f => ({ ...f, icon: e.target.value }))}
                            className="w-16 text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Color</Label>
                          <Input
                            type="color"
                            value={editForm.color ?? '#6366f1'}
                            onChange={(e) => setEditForm(f => ({ ...f, color: e.target.value }))}
                            className="w-16 h-9"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents & Context */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Documents & Context
                      </CardTitle>
                      <Badge variant="secondary">{projectDocs.length}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Upload files or paste text to give this project context. All documents are indexed for AI retrieval.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FileUpload
                      onUpload={handleFileUpload}
                      accept=".txt,.md,.pdf,.csv,.json,.xlsx"
                      className={uploading ? 'opacity-50 pointer-events-none' : ''}
                    />
                    {uploading && <p className="text-xs text-muted-foreground text-center">Uploading & indexing...</p>}

                    {/* Add text context */}
                    <AddContextInput onAdd={handleAddContext} />

                    {/* Document list */}
                    {projectDocs.length > 0 && (
                      <div className="space-y-1.5 mt-3">
                        {projectDocs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 group">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.type} {doc.content ? `· ${doc.content.length.toLocaleString()} chars` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveDoc(doc.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Project Chats */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Chats
                      </CardTitle>
                      <Badge variant="secondary">{projectChats.length}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Conversations assigned to this project use its system prompt automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projectChats.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No chats yet. Select this project in the chat controls, then start a conversation.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {projectChats.map(chat => (
                          <button
                            key={chat.id}
                            onClick={() => router.push(`/?c=${chat.id}`)}
                            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent transition-colors group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{chat.title || 'New Chat'}</p>
                              <p className="text-xs text-muted-foreground">
                                {chat.model} · {new Date(chat.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">Select a project</p>
                  <p className="text-sm">Choose a project from the list or create a new one to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Dialog */}
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
                  placeholder="Custom instructions for all chats in this project..."
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
              <Button onClick={handleCreate} disabled={!newProject.name.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function AddContextInput({ onAdd }) {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);

  function handleAdd() {
    if (!text.trim()) return;
    onAdd(text);
    setText('');
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => setExpanded(true)}>
        <Plus className="h-3.5 w-3.5" /> Add Text Context
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text context, notes, instructions, or any info the AI should know about this project..."
        rows={4}
        className="text-sm"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setExpanded(false); setText(''); }}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!text.trim()}>Add Context</Button>
      </div>
    </div>
  );
}
