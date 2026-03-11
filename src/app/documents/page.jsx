'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileUpload } from '@/components/shared/FileUpload';
import { DocumentSearch } from '@/components/dashboards/DocumentSearch';
import { FileText, Plus, Trash2, ScanLine } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, fileName: '' });

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) { const d = await res.json(); setDocuments(d.documents || []); }
    } catch {
      toast.error('Failed to load documents');
    }
    setLoading(false);
  }

  async function handleAdd() {
    try {
      const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success('Document added');
        setShowAdd(false);
        setForm({ title: '', content: '' });
        fetchDocuments();
      } else {
        toast.error('Failed to add document');
      }
    } catch {
      toast.error('Failed to add document');
    }
  }

  async function handleUpload(files) {
    setUploading(true);
    let successCount = 0;
    setUploadProgress({ current: 0, total: files.length, fileName: '' });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length, fileName: file.name });

      try {
        // First save to uploads dir
        const uploadFormData = new FormData();
        uploadFormData.append('files', file);
        uploadFormData.append('category', 'documents');
        await fetch('/api/upload', { method: 'POST', body: uploadFormData });

        // Then index for search
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        const res = await fetch('/api/documents', { method: 'POST', body: formData });
        if (res.ok) successCount++;
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded and indexed`);
    }
    fetchDocuments();
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Document deleted');
        fetchDocuments();
      } else {
        toast.error('Failed to delete document');
      }
    } catch {
      toast.error('Failed to delete document');
    }
  }

  async function handleScan(files, scanType) {
    if (!files.length) return;
    const file = files[0];
    const toastId = toast.loading(`Scanning ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', scanType);
      const res = await fetch('/api/documents/scan', { method: 'POST', body: formData });
      if (res.ok) {
        toast.success('Document scanned and saved', { id: toastId });
        fetchDocuments();
      } else {
        toast.error('Scan failed', { id: toastId });
      }
    } catch {
      toast.error('Scan failed', { id: toastId });
    }
  }

  if (loading) return <AppShell title="Documents"><LoadingSpinner /></AppShell>;

  return (
    <AppShell title="Documents">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
        <Tabs defaultValue="library">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Note
            </Button>
          </div>

          <TabsContent value="library" className="space-y-4 mt-0">
            <FileUpload onUpload={handleUpload} accept=".pdf,.txt,.md,.csv,.xlsx,.doc,.docx,.json" />

            {uploading && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uploading & indexing...</span>
                    <span>{uploadProgress.current}/{uploadProgress.total}</span>
                  </div>
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                  <p className="text-xs text-muted-foreground truncate">{uploadProgress.fileName}</p>
                </CardContent>
              </Card>
            )}

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
                          <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>
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

          <TabsContent value="search" className="mt-0 space-y-4">
            <DocumentSearch />
            <ScanSection onScan={handleScan} />
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

function ScanSection({ onScan }) {
  const [scanType, setScanType] = useState('receipt');

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4" />
          <span className="text-sm font-medium">Scan Documents</span>
        </div>
        <Select value={scanType} onValueChange={setScanType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="receipt">Scan Receipt</SelectItem>
            <SelectItem value="document">Scan Document</SelectItem>
            <SelectItem value="business_card">Scan Business Card</SelectItem>
          </SelectContent>
        </Select>
        <FileUpload onUpload={(files) => onScan(files, scanType)} accept="image/*,.pdf" />
      </CardContent>
    </Card>
  );
}
