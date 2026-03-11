'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { StatusDot } from '@/components/shared/StatusDot';
import {
  Play, Square, FolderOpen, ChevronRight, ChevronDown, ArrowUp,
  Save, Trash2, RefreshCw, Search, File, Folder, X, Plus,
} from 'lucide-react';

// --- Default launch params ---
const DEFAULT_ARGS = {
  ngl: 999, ctx: 4096, port: 8080, host: '0.0.0.0', fa: true, np: 1,
  threads: 0, threadsBatch: 0, batchSize: 2048, ubatchSize: 512,
  mlock: false, noMmap: false, numa: 'off',
  splitMode: 'layer', mainGpu: 0, tensorSplit: '',
  cacheTypeK: 'f16', cacheTypeV: 'f16',
  apiKey: '', metrics: false, noWebui: false,
  chatTemplate: 'auto', jinja: true, thinkMode: 'auto', reasoningBudget: -1, chatTemplateKwargs: '', lora: '',
  embedding: false, pooling: 'none',
  ropeScaling: 'none', ropeFreqBase: 0, ropeFreqScale: 0,
};

function formatSize(bytes) {
  if (!bytes) return '';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

// --- Collapsible Section ---
function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pl-6 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// --- File Browser ---
function FileBrowser({ modelPath, onSelect, savedDirs, onSaveDirs }) {
  const [browsePath, setBrowsePath] = useState('');
  const [items, setItems] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDir, setNewDir] = useState('');

  const browse = useCallback(async (dirPath) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/llamacpp/browse?path=${encodeURIComponent(dirPath)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setCurrentPath(data.path || dirPath);
        setParentPath(data.parent || '');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to browse directory');
      }
    } catch {
      toast.error('Failed to browse directory');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchFiles = useCallback(async (dir, query) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/llamacpp/browse?search=${encodeURIComponent(dir)}&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setItems((data.files || []).map(f => ({ ...f, type: 'file' })));
        setCurrentPath(`Search: "${query}" in ${dir}`);
        setParentPath('');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  function addSavedDir() {
    const dir = newDir.trim();
    if (!dir || savedDirs.includes(dir)) return;
    onSaveDirs([...savedDirs, dir]);
    setNewDir('');
    browse(dir);
  }

  function removeSavedDir(dir) {
    onSaveDirs(savedDirs.filter(d => d !== dir));
  }

  return (
    <div className="space-y-3">
      <Label>Model File (.gguf)</Label>
      <Input
        value={modelPath}
        onChange={(e) => onSelect(e.target.value)}
        placeholder="/path/to/model.gguf"
        className="font-mono text-sm"
      />

      {/* Saved directories */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Saved model directories</p>
        <div className="flex gap-2">
          <Input
            value={newDir}
            onChange={(e) => setNewDir(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSavedDir()}
            placeholder="/home/user/models"
            className="flex-1 text-sm"
          />
          <Button variant="outline" size="sm" onClick={addSavedDir} disabled={!newDir.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {savedDirs.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {savedDirs.map((dir) => (
              <Badge
                key={dir}
                variant="outline"
                className="cursor-pointer hover:bg-accent gap-1"
                onClick={() => browse(dir)}
              >
                <FolderOpen className="h-3 w-3" />
                {dir.split('/').pop() || dir}
                <button
                  onClick={(e) => { e.stopPropagation(); removeSavedDir(dir); }}
                  className="hover:text-destructive ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* File browser */}
      {currentPath && (
        <Card className="overflow-hidden">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {parentPath && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => browse(parentPath)}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                )}
                <span className="text-xs font-mono text-muted-foreground truncate">{currentPath}</span>
              </div>
              <div className="flex gap-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchFiles(currentPath, searchQuery)}
                  placeholder="Search..."
                  className="h-7 w-32 text-xs"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => searchFiles(currentPath, searchQuery)}>
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-48 overflow-y-auto divide-y">
              {loading ? (
                <p className="text-xs text-muted-foreground p-3">Loading...</p>
              ) : items.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">No GGUF files found</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.path}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      if (item.type === 'directory') {
                        browse(item.path);
                      } else {
                        onSelect(item.path);
                      }
                    }}
                  >
                    {item.type === 'directory' ? (
                      <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
                    ) : (
                      <File className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate font-mono text-xs">{item.name}</span>
                    {item.size && (
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatSize(item.size)}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Main Component ---
export function LlamaServerLauncher({ settings, onSave }) {
  const [status, setStatus] = useState({ running: false, binaryFound: false, log: [] });
  const [modelPath, setModelPath] = useState('');
  const [args, setArgs] = useState({ ...DEFAULT_ARGS });
  const [launching, setLaunching] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [configName, setConfigName] = useState('');
  const [log, setLog] = useState([]);
  const logRef = useRef(null);
  const [binaryPath, setBinaryPath] = useState(settings.llamacpp_binary_path || '');

  const savedDirs = (() => {
    const raw = settings.llamacpp_model_dirs;
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  })();

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/llamacpp/launch');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.log?.length) setLog(data.log);
      }
    } catch { /* silently fail */ }
  }, []);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/llamacpp/configs');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    checkStatus();
    fetchConfigs();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus, fetchConfigs]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function updateArg(key, value) {
    setArgs(prev => ({ ...prev, [key]: value }));
  }

  function handleSaveDirs(dirs) {
    onSave({ llamacpp_model_dirs: dirs });
  }

  async function handleLaunch() {
    if (!modelPath) { toast.error('Select a model file first'); return; }
    setLaunching(true);
    setLog([]);

    try {
      const res = await fetch('/api/llamacpp/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelPath, args }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to launch');
        setLaunching(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          const stripped = line.replace(/^data: /, '');
          try {
            const event = JSON.parse(stripped);
            if (event.type === 'stdout' || event.type === 'stderr') {
              setLog(prev => [...prev.slice(-MAX_LOG), event.line]);
            }
            if (event.type === 'ready') {
              toast.success(`llama-server ready on port ${event.port}`);
              checkStatus();
            }
            if (event.type === 'config_updated') {
              if (event.main_model) {
                toast.success(`Model auto-set: ${event.main_model}`);
                onSave({ main_model: event.main_model, cortex_backend: 'llamacpp' });
              }
            }
            if (event.type === 'error') {
              toast.error(event.message);
            }
            if (event.type === 'exit') {
              const detail = event.lastLog ? `\n${event.lastLog}` : '';
              toast.error(`Server exited (code ${event.code})${detail}`, { duration: 10000 });
              checkStatus();
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLaunching(false);
      checkStatus();
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      const res = await fetch('/api/llamacpp/launch', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Server stopped');
        checkStatus();
      }
    } catch {
      toast.error('Failed to stop server');
    } finally {
      setStopping(false);
    }
  }

  async function handleSaveConfig() {
    if (!configName.trim()) { toast.error('Enter a config name'); return; }
    try {
      await fetch('/api/llamacpp/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: configName, modelPath, args }),
      });
      toast.success(`Config "${configName}" saved`);
      setConfigName('');
      fetchConfigs();
    } catch { toast.error('Failed to save config'); }
  }

  async function handleDeleteConfig(name) {
    try {
      await fetch('/api/llamacpp/configs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      fetchConfigs();
    } catch { /* silently fail */ }
  }

  function loadConfig(config) {
    setModelPath(config.modelPath || '');
    setArgs({ ...DEFAULT_ARGS, ...(config.args || {}) });
    toast.success(`Loaded "${config.name}"`);
  }

  const MAX_LOG = 200;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">llama-server Launcher</h3>
        <Button variant="outline" size="sm" onClick={checkStatus}>
          <RefreshCw className="h-4 w-4 mr-2" /> Status
        </Button>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatusDot status={status.running ? 'connected' : 'disconnected'} />
        <span className="text-sm">
          {status.running
            ? `Running on :${status.port} (PID ${status.pid})`
            : 'Stopped'}
        </span>
        {!status.binaryFound && !status.running && !binaryPath && (
          <Badge variant="destructive" className="text-xs">llama-server not found</Badge>
        )}
        <div className="ml-auto flex gap-2">
          {!status.running ? (
            <Button size="sm" onClick={handleLaunch} disabled={launching || !modelPath}>
              <Play className="h-4 w-4 mr-2" />
              {launching ? 'Launching...' : 'Launch'}
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleStop} disabled={stopping}>
              <Square className="h-4 w-4 mr-2" />
              {stopping ? 'Stopping...' : 'Stop'}
            </Button>
          )}
        </div>
      </div>

      {/* Binary path */}
      <div className={`space-y-2 ${!status.binaryFound && !binaryPath ? 'p-3 rounded-md border border-destructive/50 bg-destructive/5' : ''}`}>
        <Label>llama-server Binary Path</Label>
        <Input
          value={binaryPath}
          onChange={(e) => setBinaryPath(e.target.value)}
          onBlur={() => { if (binaryPath !== (settings.llamacpp_binary_path || '')) { onSave({ llamacpp_binary_path: binaryPath }); toast.success('Binary path saved'); checkStatus(); } }}
          onKeyDown={(e) => { if (e.key === 'Enter') { onSave({ llamacpp_binary_path: binaryPath }); toast.success('Binary path saved'); checkStatus(); } }}
          placeholder="/path/to/llama-server"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Full path to the llama-server binary. Leave empty to search PATH automatically.
        </p>
      </div>

      {/* Saved Configs */}
      {configs.length > 0 && (
        <div className="space-y-2">
          <Label>Saved Configurations</Label>
          <div className="flex gap-1.5 flex-wrap">
            {configs.map((c) => (
              <Badge
                key={c.name}
                variant="outline"
                className="cursor-pointer hover:bg-accent gap-1"
                onClick={() => loadConfig(c)}
              >
                {c.name}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteConfig(c.name); }}
                  className="hover:text-destructive ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Save current config */}
      <div className="flex gap-2">
        <Input
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
          placeholder="Config name..."
          className="flex-1 text-sm"
        />
        <Button variant="outline" size="sm" onClick={handleSaveConfig} disabled={!configName.trim()}>
          <Save className="h-4 w-4 mr-2" /> Save Config
        </Button>
      </div>

      {/* Model file browser */}
      <FileBrowser
        modelPath={modelPath}
        onSelect={setModelPath}
        savedDirs={savedDirs}
        onSaveDirs={handleSaveDirs}
      />

      {/* Launch params */}
      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-medium">Launch Parameters</h4>

        {/* Essential — always visible */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>GPU Layers</Label>
              <span className="text-xs font-mono text-muted-foreground">{args.ngl === 999 ? 'All' : args.ngl}</span>
            </div>
            <Slider value={[args.ngl]} onValueChange={([v]) => updateArg('ngl', v)} min={0} max={999} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Context Size</Label>
            <Input type="number" value={args.ctx} onChange={(e) => updateArg('ctx', Number(e.target.value))} min={512} max={131072} step={512} />
          </div>
          <div className="space-y-2">
            <Label>Port</Label>
            <Input type="number" value={args.port} onChange={(e) => updateArg('port', Number(e.target.value))} min={1024} max={65535} />
          </div>
          <div className="space-y-2">
            <Label>Parallel Slots</Label>
            <Input type="number" value={args.np} onChange={(e) => updateArg('np', Number(e.target.value))} min={1} max={64} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <Label>Flash Attention</Label>
            <p className="text-xs text-muted-foreground">Faster prompt processing, lower memory</p>
          </div>
          <Switch checked={args.fa} onCheckedChange={(v) => updateArg('fa', v)} />
        </div>

        {/* Collapsible sections */}
        <Section title="Memory & Performance">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Threads (-t)</Label>
              <Input type="number" value={args.threads} onChange={(e) => updateArg('threads', Number(e.target.value))} min={0} placeholder="auto" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Batch Threads (-tb)</Label>
              <Input type="number" value={args.threadsBatch} onChange={(e) => updateArg('threadsBatch', Number(e.target.value))} min={0} placeholder="auto" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Batch Size (-b)</Label>
              <Input type="number" value={args.batchSize} onChange={(e) => updateArg('batchSize', Number(e.target.value))} min={1} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Micro Batch (-ub)</Label>
              <Input type="number" value={args.ubatchSize} onChange={(e) => updateArg('ubatchSize', Number(e.target.value))} min={1} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Memory Lock (--mlock)</Label>
            <Switch checked={args.mlock} onCheckedChange={(v) => updateArg('mlock', v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">No Memory Map (--no-mmap)</Label>
            <Switch checked={args.noMmap} onCheckedChange={(v) => updateArg('noMmap', v)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">NUMA</Label>
            <Select value={args.numa} onValueChange={(v) => updateArg('numa', v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="distribute">Distribute</SelectItem>
                <SelectItem value="isolate">Isolate</SelectItem>
                <SelectItem value="numactl">NumaCtl</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section title="GPU">
          <div className="space-y-1">
            <Label className="text-xs">Split Mode (-sm)</Label>
            <Select value={args.splitMode} onValueChange={(v) => updateArg('splitMode', v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="layer">Layer</SelectItem>
                <SelectItem value="row">Row</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Main GPU (-mg)</Label>
              <Input type="number" value={args.mainGpu} onChange={(e) => updateArg('mainGpu', Number(e.target.value))} min={0} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tensor Split (-ts)</Label>
              <Input value={args.tensorSplit} onChange={(e) => updateArg('tensorSplit', e.target.value)} placeholder="e.g. 3,1" />
            </div>
          </div>
        </Section>

        <Section title="KV Cache">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Cache Type K (-ctk)</Label>
              <Select value={args.cacheTypeK} onValueChange={(v) => updateArg('cacheTypeK', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['f16', 'f32', 'bf16', 'q8_0', 'q4_0', 'q4_1', 'q5_0', 'q5_1'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cache Type V (-ctv)</Label>
              <Select value={args.cacheTypeV} onValueChange={(v) => updateArg('cacheTypeV', v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['f16', 'f32', 'bf16', 'q8_0', 'q4_0', 'q4_1', 'q5_0', 'q5_1'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section title="Network">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Host (--host)</Label>
              <Input value={args.host} onChange={(e) => updateArg('host', e.target.value)} placeholder="0.0.0.0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">API Key (--api-key)</Label>
              <Input value={args.apiKey} onChange={(e) => updateArg('apiKey', e.target.value)} type="password" placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Prometheus Metrics (--metrics)</Label>
            <Switch checked={args.metrics} onCheckedChange={(v) => updateArg('metrics', v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Disable Web UI (--no-webui)</Label>
            <Switch checked={args.noWebui} onCheckedChange={(v) => updateArg('noWebui', v)} />
          </div>
        </Section>

        <Section title="Model & Template">
          <div className="space-y-1">
            <Label className="text-xs">Chat Template (--chat-template)</Label>
            <Select value={args.chatTemplate} onValueChange={(v) => updateArg('chatTemplate', v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="auto">auto (use GGUF embedded)</SelectItem>
                <SelectGroup>
                  <SelectLabel>Popular</SelectLabel>
                  {['chatml', 'llama3', 'llama4', 'deepseek3', 'gemma', 'phi4', 'mistral-v3', 'command-r', 'gpt-oss'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Qwen / Alibaba</SelectLabel>
                  {['chatml', 'bailing', 'bailing-think', 'bailing2', 'pangu-embedded'].map(t => (
                    <SelectItem key={`qwen-${t}`} value={t}>{t}{t === 'chatml' ? ' (Qwen2/2.5)' : t === 'bailing' ? ' (Qwen3+)' : t === 'bailing-think' ? ' (Qwen3+ think)' : ''}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Chinese Models</SelectLabel>
                  {['chatglm3', 'chatglm4', 'glmedge', 'kimi-k2', 'megrez', 'minicpm', 'hunyuan-dense', 'hunyuan-moe'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Meta / Llama</SelectLabel>
                  {['llama2', 'llama2-sys', 'llama2-sys-bos', 'llama2-sys-strip'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>DeepSeek</SelectLabel>
                  {['deepseek', 'deepseek2'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Mistral</SelectLabel>
                  {['mistral-v1', 'mistral-v3-tekken', 'mistral-v7', 'mistral-v7-tekken'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Others</SelectLabel>
                  {['exaone3', 'exaone4', 'exaone-moe', 'falcon3', 'gigachat', 'granite', 'grok-2', 'monarch', 'openchat', 'orion', 'phi3', 'rwkv-world', 'seed_oss', 'smolvlm', 'solar-open', 'vicuna', 'vicuna-orca', 'yandex', 'zephyr'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">For Qwen3/3.5 models: use Jinja (below) — it reads the template from the GGUF automatically. No need to pick a template manually.</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Jinja Templates (--jinja)</Label>
            <Switch checked={args.jinja} onCheckedChange={(v) => updateArg('jinja', v)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reasoning Format (--think)</Label>
            <Select value={args.thinkMode} onValueChange={(v) => updateArg('thinkMode', v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (detect from model)</SelectItem>
                <SelectItem value="none">None (raw output, no parsing)</SelectItem>
                <SelectItem value="deepseek">DeepSeek / Qwen (→ reasoning_content)</SelectItem>
                <SelectItem value="deepseek-legacy">Legacy (keep &lt;think&gt; tags in content)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">How &lt;think&gt; blocks are parsed. "DeepSeek / Qwen" extracts thinking into reasoning_content. Works for Qwen3, Qwen3.5, DeepSeek R1, QwQ, etc.</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reasoning Budget (--reasoning-budget)</Label>
            <Select value={String(args.reasoningBudget)} onValueChange={(v) => updateArg('reasoningBudget', Number(v))}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Unrestricted (default)</SelectItem>
                <SelectItem value="0">Disabled (no thinking)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Set to "Disabled" to hard-disable thinking at server level. Works with Qwen3, QwQ, DeepSeek R1 distills, etc.</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Chat Template Kwargs (--chat-template-kwargs)</Label>
            <Input
              value={args.chatTemplateKwargs}
              onChange={(e) => updateArg('chatTemplateKwargs', e.target.value)}
              placeholder='{"enable_thinking": false}'
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">JSON passed to Jinja template. Qwen: {'{"enable_thinking": false}'}. GPT-OSS: {'{"reasoning_effort": "low"}'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">LoRA Path (--lora)</Label>
            <Input value={args.lora} onChange={(e) => updateArg('lora', e.target.value)} placeholder="/path/to/adapter.gguf" className="font-mono text-xs" />
          </div>
        </Section>

        <Section title="Embedding">
          <p className="text-[10px] text-muted-foreground -mt-2 mb-2">Embedding mode turns this into a dedicated vector embedding server (like nomic-embed-text). It disables chat/completion endpoints and only exposes /v1/embeddings. Used for RAG, semantic search, and memory similarity. Load an embedding model (not a chat model) when enabled.</p>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Embedding Mode (--embedding)</Label>
              <p className="text-[10px] text-muted-foreground">Restricts server to embedding-only. Chat endpoints will be disabled.</p>
            </div>
            <Switch checked={args.embedding} onCheckedChange={(v) => updateArg('embedding', v)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pooling (--pooling)</Label>
            <Select value={args.pooling} onValueChange={(v) => updateArg('pooling', v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="mean">mean (most common)</SelectItem>
                <SelectItem value="cls">cls</SelectItem>
                <SelectItem value="last">last (Qwen3-Embedding)</SelectItem>
                <SelectItem value="rank">rank</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">How token embeddings are combined. "mean" for most models (nomic, bge, e5). "last" for Qwen3-Embedding.</p>
          </div>
        </Section>

        <Section title="RoPE">
          <div className="space-y-1">
            <Label className="text-xs">RoPE Scaling (--rope-scaling)</Label>
            <Select value={args.ropeScaling} onValueChange={(v) => updateArg('ropeScaling', v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="yarn">YaRN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Freq Base</Label>
              <Input type="number" value={args.ropeFreqBase} onChange={(e) => updateArg('ropeFreqBase', Number(e.target.value))} min={0} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Freq Scale</Label>
              <Input type="number" value={args.ropeFreqScale} onChange={(e) => updateArg('ropeFreqScale', Number(e.target.value))} min={0} step={0.1} />
            </div>
          </div>
        </Section>
      </div>

      {/* Launch log */}
      {log.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Server Log</Label>
            <Button variant="ghost" size="sm" onClick={() => setLog([])}>Clear</Button>
          </div>
          <div
            ref={logRef}
            className="bg-black text-green-400 font-mono text-xs p-3 rounded-md max-h-48 overflow-y-auto whitespace-pre-wrap"
          >
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
