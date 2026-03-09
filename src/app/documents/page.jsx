'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileUpload } from '@/components/shared/FileUpload';
import { DocumentScanner } from '@/components/dashboards/DocumentScanner';
import { DocumentSearch } from '@/components/dashboards/DocumentSearch';
import { FileText, Plus, Trash2, Upload } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    setLoading(true);
    const res = await fetch('/api/documents');
    if (res.ok) { const d = await res.json(); setDocuments(d.documents || []); }
    setLoading(false);
  }

  async function handleAdd() {
    await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowAdd(false);
    setForm({ title: '', content: '' });
    fetchDocuments();
  }

  async function handleUpload(files) {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      await fetch('/api/documents', { method: 'POST', body: formData });
    }
    fetchDocuments();
  }

  async function handleDelete(id) {
    await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    fetchDocuments();
  }

  if (loading) return <AppShell title="Documents"><LoadingSpinner /></AppShell>;

  return (
    <AppShell title="Documents">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Note</Button>
            </div>
            <FileUpload onUpload={handleUpload} accept=".pdf,.txt,.md,.csv" />

            {documents.length === 0 ? (
              <EmptyState icon={FileText} title="No documents" description="Upload or add documents to build your knowledge base" />
            ) : (
              <div className="space-y-2">
                {documents.map(d => (
                  <Card key={d.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{d.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{d.type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-4">
            <DocumentSearch />
          </TabsContent>

          <TabsContent value="scanner" className="mt-4">
            <DocumentScanner onScanComplete={fetchDocuments} />
          </TabsContent>
        </Tabs>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent><DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div><Label>Content</Label><Textarea rows={8} value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
