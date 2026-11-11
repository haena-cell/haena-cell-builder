"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 공고 넣기 확인 화면과 공고 수정에서 함께 쓰는 칸들: 한 줄 추가, 제출 서류 고르기, 전형 절차

export const DEFAULT_DOCS = ["이력서", "포트폴리오", "과제", "자기소개서"];

export function AddInput({ placeholder, value, onChange, onAdd, label }: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  label: string;
}) {
  return (
    <div className="flex gap-2">
      <Input placeholder={placeholder} aria-label={placeholder} className="h-10" value={value} maxLength={50}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); onAdd(); } }} />
      <Button type="button" variant="outline" size="icon-lg" onClick={onAdd} aria-label={label}><Plus /></Button>
    </div>
  );
}

export function DocPicker({ value, onChange }: { value: string[]; onChange: (docs: string[]) => void }) {
  const [options, setOptions] = useState(() => [...new Set([...DEFAULT_DOCS, ...value])]);
  const [newDoc, setNewDoc] = useState("");
  function add() {
    const doc = newDoc.trim();
    if (!doc) return;
    setOptions((prev) => (prev.includes(doc) ? prev : [...prev, doc]));
    if (!value.includes(doc)) onChange([...value, doc]);
    setNewDoc("");
  }
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((doc) => {
          const on = value.includes(doc);
          return (
            <Button key={doc} type="button" variant="outline" size="sm" aria-pressed={on}
              className={cn(on && "border-foreground bg-foreground text-background hover:bg-foreground/85 hover:text-background")}
              onClick={() => onChange(on ? value.filter((d) => d !== doc) : [...value, doc])}>
              {on && <Check data-icon="inline-start" />}
              {doc}
            </Button>
          );
        })}
      </div>
      <AddInput placeholder="다른 서류 추가" value={newDoc} onChange={setNewDoc} onAdd={add} label="서류 추가" />
    </>
  );
}

export type StepItem = { id: string; name: string };
export const newStepItem = (name: string): StepItem => ({ id: `new-${crypto.randomUUID()}`, name });

// 전형 절차: 손잡이로 끌어서 옮기기 + 화살표 + 빼기 + 추가 (D-48)
export function StepEditor({ items, onChange }: { items: StepItem[]; onChange: (items: StepItem[]) => void }) {
  const [newStep, setNewStep] = useState("");
  const [drag, setDrag] = useState<{ from: number; over: number; dy: number } | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const stopDrag = useRef<(() => void) | null>(null);
  useEffect(() => () => stopDrag.current?.(), []);

  function move(from: number, to: number) {
    if (to === from) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  // 끄는 동안에는 줄을 그대로 두고, 놓을 자리에 선만 보여 준다. 놓으면 옮긴다
  function startDrag(e: React.PointerEvent, from: number) {
    if (e.button !== 0 || !listRef.current) return;
    e.preventDefault();
    const startY = e.clientY;
    const middles = [...listRef.current.children].map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    let over = from;
    setDrag({ from, over, dy: 0 });
    const onMove = (ev: PointerEvent) => {
      over = middles.filter((m) => m < ev.clientY).length;
      setDrag({ from, over, dy: ev.clientY - startY });
    };
    const finish = (apply: boolean) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      stopDrag.current = null;
      setDrag(null);
      if (apply) move(from, over > from ? over - 1 : over);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    stopDrag.current = () => finish(false);
  }

  function add() {
    const name = newStep.trim();
    if (!name) return;
    onChange([...items, newStepItem(name)]);
    setNewStep("");
  }

  const showLine = (i: number) => drag !== null && drag.over === i && i !== drag.from && i !== drag.from + 1;

  return (
    <>
      <ol ref={listRef} className="flex flex-col">
        {items.map((step, i) => {
          const dragging = drag?.from === i;
          return (
            <li
              key={step.id}
              style={dragging ? { transform: `translateY(${drag.dy}px)` } : undefined}
              className={cn("relative flex items-center gap-2 py-1", dragging && "z-10 rounded-lg bg-card shadow-soft")}
            >
              {showLine(i) && <span className="absolute inset-x-0 -top-px h-0.5 rounded-full bg-primary" aria-hidden />}
              {i === items.length - 1 && showLine(items.length) && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden />}
              <button
                type="button"
                tabIndex={-1}
                aria-label={`${step.name} 끌어서 옮기기`}
                className={cn("flex size-7 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted", dragging ? "cursor-grabbing" : "cursor-grab")}
                onPointerDown={(e) => startDrag(e, i)}
              >
                <GripVertical className="size-4" />
              </button>
              <span className="flex flex-col items-center self-stretch">
                <span className={cn("w-px flex-1", i === 0 || dragging ? "bg-transparent" : "bg-input")} />
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{i + 1}</span>
                <span className={cn("w-px flex-1", i === items.length - 1 || dragging ? "bg-transparent" : "bg-input")} />
              </span>
              <span className="min-w-0 flex-1 truncate rounded-lg bg-card px-3.5 py-2 text-sm ring-1 ring-input">{step.name}</span>
              <span className="flex shrink-0">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${step.name} 위로`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${step.name} 아래로`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><ArrowDown /></Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${step.name} 빼기`} onClick={() => onChange(items.filter((_, j) => j !== i))}><X /></Button>
              </span>
            </li>
          );
        })}
      </ol>
      <AddInput placeholder="단계 추가 (예: 2차 면접)" value={newStep} onChange={setNewStep} onAdd={add} label="단계 추가" />
    </>
  );
}
