'use client';

import { useState, useEffect, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { FileText, Download, Eye, Zap, Loader2, X, Upload } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '@/lib/api';
import { SkillTag } from '@/components/ui/SkillTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { handleApiError } from '@/lib/apiError';

interface StoredResume {
  resume_id: string;
  filename: string;
  parse_status: string;
  uploaded_at: string;
}

interface TextPreview {
  text_preview: string;
  total_characters: number;
  parse_status: string;
}

interface ResumePanelProps {
  onResumeCountChange?: (count: number) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function ParseStatusBadge({ status }: { status: string }) {
  const isParsed = status === 'parsed' || status === 'completed' || status === 'success';
  if (isParsed) {
    return (
      <span
        className="font-mono text-xs px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: 'rgb(0 229 160 / 0.1)',
          color: '#00E5A0',
          border: '1px solid rgb(0 229 160 / 0.3)',
        }}
      >
        Parsed ✓
      </span>
    );
  }
  return (
    <span
      title="File could not be parsed. Try uploading a different format."
      className="font-mono text-xs px-2 py-0.5 rounded-full cursor-help"
      style={{
        backgroundColor: 'rgb(245 166 35 / 0.1)',
        color: '#F5A623',
        border: '1px solid rgb(245 166 35 / 0.3)',
      }}
    >
      Parse failed
    </span>
  );
}

export function ResumePanel({ onResumeCountChange }: ResumePanelProps) {
  const toast = useToast();
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<TextPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [skillsMap, setSkillsMap] = useState<Record<string, string[]>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('rm_resumes') ?? '[]') as StoredResume[];
      setResumes(stored);
    } catch {
      setResumes([]);
    }
  }, []);

  function persist(updated: StoredResume[]) {
    localStorage.setItem('rm_resumes', JSON.stringify(updated));
    setResumes(updated);
    onResumeCountChange?.(updated.length);
  }

  function validateFile(file: File): string | null {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      return 'Only .pdf and .docx files are accepted.';
    }
    return null;
  }

  function handleFileSelect(file: File) {
    const err = validateFile(file);
    if (err) {
      setUploadError(err);
      setSelectedFile(null);
    } else {
      setUploadError(null);
      setSelectedFile(file);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      const { data } = await api.post('/resumes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const entry: StoredResume = {
        resume_id: data.resume_id,
        filename: data.filename ?? selectedFile.name,
        parse_status: data.parse_status ?? 'pending',
        uploaded_at: new Date().toISOString(),
      };
      persist([entry, ...resumes]);
      setSelectedFile(null);
      toast.success('Resume uploaded');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setUploadError(detail ?? 'Upload failed. Please try again.');
      handleApiError(err, toast, { fallback: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  }

  async function handlePreview(resumeId: string) {
    setPreviewData(null);
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const { data } = await api.get(`/resumes/${resumeId}/text`);
      setPreviewData(data);
    } catch (err) {
      setPreviewData(null);
      handleApiError(err, toast);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDownload(resumeId: string) {
    try {
      const { data } = await api.get(`/resumes/${resumeId}/download-url`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Download failed' });
    }
  }

  async function handleExtractSkills(resumeId: string) {
    setExtractingId(resumeId);
    try {
      const { data } = await api.post('/ai/skill-extraction', { resume_id: resumeId });
      setSkillsMap((prev) => ({ ...prev, [resumeId]: data.skills ?? [] }));
      toast.success('Skills extracted');
    } catch (err) {
      handleApiError(err, toast, { fallback: 'Skill extraction failed' });
    } finally {
      setExtractingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none ${
          dragOver
            ? 'border-accent-green'
            : 'border-border-dim hover:border-accent-green'
        }`}
        style={dragOver ? { backgroundColor: 'rgb(0 229 160 / 0.04)' } : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={onInputChange}
        />
        {selectedFile ? (
          <p className="text-text-primary font-mono text-sm">
            {selectedFile.name}{' '}
            <span className="text-text-muted">({formatBytes(selectedFile.size)})</span>
          </p>
        ) : (
          <p className="text-text-muted text-sm">
            Drag & drop a{' '}
            <span className="text-text-primary">.pdf</span> or{' '}
            <span className="text-text-primary">.docx</span> here, or{' '}
            <span className="text-accent-blue">click to browse</span>
          </p>
        )}
        {uploadError && (
          <p
            className="text-xs mt-2"
            style={{ color: '#F06060' }}
            onClick={(e) => e.stopPropagation()}
          >
            {uploadError}
          </p>
        )}
      </div>

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-2 bg-accent-green text-bg-base font-bold px-5 py-2.5 rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading…
            </>
          ) : (
            'Upload Resume'
          )}
        </button>
      )}

      {/* Resume list */}
      <div className="space-y-3">
        {resumes.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="No resumes uploaded yet"
            subtitle="Upload your first resume"
          />
        ) : null}
        {resumes.map((resume) => (
          <div key={resume.resume_id} className="bg-bg-surface border border-border-dim rounded-lg px-5 py-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-text-muted shrink-0" />

              <div className="flex-1 min-w-0">
                <span className="text-text-primary text-sm font-medium truncate block">
                  {resume.filename}
                </span>
                <span className="text-text-muted font-mono text-xs">
                  {formatDate(resume.uploaded_at)}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <ParseStatusBadge status={resume.parse_status} />
                <button
                  onClick={() => handlePreview(resume.resume_id)}
                  title="Preview Text"
                  className="flex items-center gap-1 text-text-muted hover:text-accent-blue transition-colors text-xs px-2 py-1 rounded border border-border-dim hover:border-accent-blue/50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Text
                </button>
                <button
                  onClick={() => handleDownload(resume.resume_id)}
                  title="Download"
                  className="flex items-center gap-1 text-text-muted hover:text-accent-blue transition-colors text-xs px-2 py-1 rounded border border-border-dim hover:border-accent-blue/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => handleExtractSkills(resume.resume_id)}
                  disabled={extractingId === resume.resume_id}
                  title="Extract Skills"
                  className="flex items-center gap-1 text-text-muted hover:text-accent-green transition-colors text-xs px-2 py-1 rounded border border-border-dim hover:border-accent-green/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {extractingId === resume.resume_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Extract Skills
                </button>
              </div>
            </div>

            {skillsMap[resume.resume_id] && skillsMap[resume.resume_id].length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-8">
                {skillsMap[resume.resume_id].map((skill) => (
                  <SkillTag key={skill} label={skill} variant="matched" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Text preview modal */}
      <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-bg-surface border border-border-dim rounded-xl p-6 shadow-xl focus:outline-none flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <Dialog.Title className="text-text-primary font-semibold text-base">
                Resume Text Preview
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-text-muted hover:text-text-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                </div>
              ) : previewData ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <ParseStatusBadge status={previewData.parse_status} />
                    <span className="text-text-muted font-mono text-xs">
                      {previewData.total_characters.toLocaleString()} characters
                    </span>
                  </div>
                  <pre className="text-text-secondary text-xs whitespace-pre-wrap leading-relaxed font-mono bg-bg-elevated border border-border-dim rounded-lg p-4">
                    {previewData.text_preview}
                  </pre>
                </>
              ) : (
                <p className="text-text-muted text-sm text-center py-12">
                  Could not load preview.
                </p>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
