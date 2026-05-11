'use client';

import { KeyboardEvent, useRef } from 'react';
import { X } from 'lucide-react';

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsTagInput({ skills, onChange }: SkillsTagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addSkill(raw: string) {
    const trimmed = raw.replace(/,/g, '').trim();
    if (!trimmed || skills.includes(trimmed)) {
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onChange([...skills, trimmed]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(e.currentTarget.value);
    } else if (e.key === 'Backspace' && !e.currentTarget.value && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  }

  function handleBlur() {
    if (inputRef.current?.value) {
      addSkill(inputRef.current.value);
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 items-center bg-bg-elevated border border-border-dim rounded-lg px-3 py-2 min-h-11 focus-within:border-accent-green/60 focus-within:bg-bg-elevated transition-all cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-accent-green/30 bg-accent-green/10 text-accent-green font-mono text-xs shrink-0 transition-colors hover:bg-accent-green/15"
        >
          {skill}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(skills.filter((s) => s !== skill));
            }}
            className="text-accent-green/70 hover:text-accent-green transition-colors leading-none ml-0.5 rounded-full hover:bg-accent-green/20 p-0.5"
            aria-label={`Remove ${skill}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={skills.length === 0 ? 'Type a skill and press Enter…' : ''}
        className="flex-1 min-w-32 bg-transparent font-mono text-sm text-text-primary placeholder:text-text-muted outline-none py-0.5"
      />
    </div>
  );
}
