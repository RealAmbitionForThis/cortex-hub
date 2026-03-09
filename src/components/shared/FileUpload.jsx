'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

export function FileUpload({ onUpload, accept, className = '' }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onUpload) onUpload(files);
  }, [onUpload]);

  const handleChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && onUpload) onUpload(files);
  }, [onUpload]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'} ${className}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mb-2">Drag & drop files here or</p>
      <label className="cursor-pointer text-sm text-primary hover:underline">
        browse files
        <input type="file" className="hidden" accept={accept} onChange={handleChange} multiple />
      </label>
    </div>
  );
}
