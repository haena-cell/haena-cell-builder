"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Copy, ImageUp, Layers, Link2, Loader2, Lock, Plus, Sparkles, X, XCircle } from "lucide-react";
import { ExtractProgress } from "@/components/postings/extract-progress";
import { Mascot } from "@/components/mascot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/postings/segmented";
import type { ExtractInput, ExtractResult } from "@/lib/extract-posting";
import { findSavedByLink, type PostingSummary } from "@/lib/posting-actions";
import { saveDraft, saveQueue, type Draft, type DraftSource } from "@/lib/practice-store";

type Mode = "link" | "text" | "image" | "multi";

// 여러 개 한 번에 (D-67): 링크·캡처를 합쳐 최대 5개, 2개씩 동시에 읽는다
const MAX_MULTI = 5;
const MULTI_AT_ONCE = 2;
type MultiImage = { id: string; dataUrl: string; preview: string };
type JobStatus = "wait" | "reading" | "ok" | "saved" | "fail";
type Job = { key: string; label: string; status: JobStatus; message?: string; existing?: PostingSummary; draft?: Draft };

const linksIn = (raw: string) => [...new Set(raw.split(/\s+/).map((t) => t.trim()).filter((t) => /^https?:\/\/\S+$/i.test(t)))];
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// 휴대폰 캡처는 크기가 커서 브라우저에서 긴 변 1600px JPEG로 줄인 뒤 보낸다
async function resizeImage(file: File, maxSide = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

const INCOMING_KEY = "pacemate:incoming";
const INCOMING_EVENT = "pacemate:incoming";

export function NewPostingForm() {
  const [mode, setMode] = useState<Mode>("link");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<PostingSummary | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const multiFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  // 여러 개 한 번에 (D-67)
  const [multiLinks, setMultiLinks] = useState("");
  const [multiImages, setMultiImages] = useState<MultiImage[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const multiUrls = linksIn(multiLinks);
  const multiTotal = multiUrls.length + multiImages.length;
  const multiRunning = jobs.some((j) => j.status === "wait" || j.status === "reading");
  const readyDrafts = jobs.filter((j) => j.status === "ok" && j.draft).map((j) => j.draft!);

  async function addMultiFiles(files: FileList | File[] | null) {
    if (!files) return;
    setError(null);
    const room = MAX_MULTI - multiTotal;
    const picked = [...files].slice(0, Math.max(0, room));
    if (files.length > room) setError(`한 번에 ${MAX_MULTI}개까지 넣을 수 있어요.`);
    try {
      const added = await Promise.all(
        // AI 로 보낼 캡처(긴 변 1600px)와 확인 화면용 작은 미리보기(800px)를 따로 만든다
        picked.map(async (file) => ({ id: crypto.randomUUID(), dataUrl: await resizeImage(file), preview: await resizeImage(file, 800) })),
      );
      setMultiImages((prev) => [...prev, ...added]);
    } catch {
      setError("열 수 없는 이미지가 있어요. 다른 캡처를 골라 주세요.");
    }
  }

  // 공고 하나 읽기 → 상태를 Job 으로 돌려준다 (하나 넣기와 같은 규칙: 이미 저장한 링크는 정리하지 않는다)
  async function readOne(input: ExtractInput, source: DraftSource): Promise<Omit<Job, "key" | "label">> {
    try {
      if (input.kind === "link") {
        const existing = await findSavedByLink(input.url);
        if (existing) return { status: "saved", existing };
      }
      const res = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = (await res.json()) as ExtractResult & { error?: string };
      if (!res.ok) return { status: "fail", message: data.error ?? "정리하지 못했어요." };
      if (data.status === "need_fallback") return { status: "fail", message: "이 사이트는 바로 읽을 수 없어요. 글 붙여넣기·캡처로 따로 넣어 주세요." };
      if (data.status !== "ok") return { status: "fail", message: "정리하지 못했어요." };
      return {
        status: "ok",
        draft: { posting: data.posting, isExample: data.isExample, source, hint: data.hint },
      };
    } catch {
      return { status: "fail", message: "인터넷 연결을 확인해 주세요." };
    }
  }

  async function runMulti() {
    if (multiTotal === 0 || multiTotal > MAX_MULTI) return;
    setError(null);
    const tasks: { key: string; label: string; input: ExtractInput; source: DraftSource }[] = [
      ...multiUrls.map((url) => ({ key: url, label: hostOf(url), input: { kind: "link", url } as ExtractInput, source: { kind: "link", url } as DraftSource })),
      ...multiImages.map((img, i) => ({
        key: img.id,
        label: `캡처 ${i + 1}`,
        input: { kind: "image", dataUrl: img.dataUrl } as ExtractInput,
        source: { kind: "image", previewDataUrl: img.preview } as DraftSource,
      })),
    ];
    setJobs(tasks.map((t) => ({ key: t.key, label: t.label, status: "wait" })));
    const patch = (key: string, change: Partial<Job>) => setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...change } : j)));
    let next = 0;
    async function worker() {
      while (next < tasks.length) {
        const task = tasks[next++];
        patch(task.key, { status: "reading" });
        patch(task.key, await readOne(task.input, task.source));
      }
    }
    await Promise.all(Array.from({ length: Math.min(MULTI_AT_ONCE, tasks.length) }, worker));
  }

  // 캡처를 끌어다 놓기 (2026-11-12 사용자 요청): 1장이면 [캡처], 여러 장이면 [여러 개]로 넣는다
  const [dropping, setDropping] = useState(false);
  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");
  function onDrop(e: React.DragEvent) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDropping(false);
    if (loading || multiRunning) return;
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return setError("이미지 파일만 넣을 수 있어요.");
    setJobs([]);
    if (mode === "multi" || files.length > 1) {
      setMode("multi");
      addMultiFiles(files);
    } else {
      setMode("image");
      handleFile(files[0]);
    }
  }

  function reviewAll() {
    if (readyDrafts.length === 0) return;
    if (!saveQueue(readyDrafts)) {
      setError("정리 결과가 너무 커서 옮기지 못했어요. 캡처 수를 줄여 다시 시도해 주세요.");
      return;
    }
    setMultiLinks("");
    setMultiImages([]);
    setJobs([]);
    setMode("link");
    router.push("/app/new/review");
  }

  // 글·캡처로 넣을 때 링크 칸에 남아 있는 링크 (함께 저장)
  const linkToKeep = /^https?:\/\/\S+$/i.test(url.trim()) ? url.trim() : "";

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setImage(await resizeImage(file));
    } catch {
      setError("이 이미지는 열 수 없어요. 다른 캡처를 골라 주세요.");
    }
  }

  // incoming: 크롬 확장 프로그램이 보낸 공고 화면 (D-33). 화면 글·캡처로 정리하고, 저장에는 링크만 남긴다
  async function submit(from: Mode, incoming?: { input: ExtractInput; url: string }) {
    const input: ExtractInput | null = incoming
      ? incoming.input
      : from === "link"
        ? { kind: "link", url }
        : from === "text"
          ? { kind: "text", text }
          : image
            ? { kind: "image", dataUrl: image }
            : null;
    if (!input) {
      setError("캡처를 먼저 골라 주세요.");
      return;
    }

    setMode(from);
    setLoading(true);
    setError(null);
    setSaved(null);
    try {
      // 이미 저장한 링크면 정리하지 않고 알려 준다 (T-08)
      const checkUrl = incoming ? incoming.url : input.kind === "link" ? input.url : null;
      if (checkUrl) {
        const existing = await findSavedByLink(checkUrl);
        if (existing) {
          setSaved(existing);
          return;
        }
      }
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as ExtractResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "정리하지 못했어요. 다시 시도해 주세요.");
      } else if (data.status === "need_fallback") {
        setFallbackMessage(data.message);
        setMode("text");
      } else if (data.status === "ok") {
        // 링크로 못 읽어 글·캡처로 넣을 때도 그 링크는 함께 저장한다 (나중에 원래 공고로 가 보기, D-31)
        const link = linkToKeep || undefined;
        const source: DraftSource = incoming
          ? { kind: "link", url: incoming.url, viaExtension: true }
          : input.kind === "link"
            ? { kind: "link", url: input.url }
            : input.kind === "image"
              ? { kind: "image", previewDataUrl: input.dataUrl, url: link }
              : { kind: "text", text: input.text, url: link };
        if (!saveDraft({ posting: data.posting, isExample: data.isExample, source, hint: data.hint })) {
          setError("정리 결과를 옮기지 못했어요. 다시 시도해 주세요.");
          return;
        }
        // 이 화면은 떠나도 숨겨진 채 남는다(Activity) → 다음 공고를 넣을 때 빈 칸에서 시작하도록 비운다
        setUrl("");
        setText("");
        setImage(null);
        setFallbackMessage(null);
        setMode("link");
        router.push("/app/new/review");
        return;
      }
    } catch {
      setError("인터넷 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  // 크롬 확장 프로그램이 이 탭에 건넨 공고 (sessionStorage + 'pacemate:incoming' 신호, D-33)
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    function consume() {
      let raw: string | null = null;
      try {
        raw = sessionStorage.getItem(INCOMING_KEY);
        sessionStorage.removeItem(INCOMING_KEY);
      } catch {
        return;
      }
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as { url?: unknown; text?: unknown; image?: unknown };
        const pageUrl = typeof data.url === "string" && /^https?:\/\//.test(data.url) ? data.url : "";
        const pageText = typeof data.text === "string" ? data.text.trim().slice(0, 20_000) : "";
        const shot = typeof data.image === "string" && data.image.startsWith("data:image/") ? data.image : null;
        if (!pageUrl) return;
        setUrl(pageUrl);
        // 글이 충분하면 글로, 거의 없으면(이미지 공고) 화면 캡처로 정리
        if (pageText.length >= 300 || !shot) {
          setText(pageText);
          submitRef.current("text", { input: { kind: "text", text: pageText.padEnd(20, " ") }, url: pageUrl });
        } else {
          setImage(shot);
          submitRef.current("image", { input: { kind: "image", dataUrl: shot }, url: pageUrl });
        }
      } catch {
        setError("확장 프로그램에서 받은 공고를 읽지 못했어요. 다시 시도해 주세요.");
      }
    }
    consume();
    window.addEventListener(INCOMING_EVENT, consume);
    return () => window.removeEventListener(INCOMING_EVENT, consume);
  }, []);

  const canSubmit =
    mode === "multi"
      ? multiTotal > 0 && multiTotal <= MAX_MULTI && jobs.length === 0 // 한 번 정리한 뒤에는 링크·캡처를 바꿔야 다시 정리(비용 두 번 방지)
      : mode === "link"
        ? !!url.trim()
        : mode === "text"
          ? !!text.trim()
          : !!image;

  return (
    <div
      className="relative flex flex-col gap-5"
      onDragEnter={(e) => hasFiles(e) && setDropping(true)}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false);
      }}
      onDrop={onDrop}
    >
      {dropping && (
        <div className="pointer-events-none absolute -inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary bg-primary-soft/90 text-primary-strong">
          <ImageUp className="size-8" />
          <p className="font-semibold">여기에 놓으면 캡처로 넣어요</p>
          <p className="text-xs">여러 장이면 한 번에 {MAX_MULTI}개까지</p>
        </div>
      )}
      <Segmented
        label="넣는 방법"
        value={mode}
        onChange={switchMode}
        disabled={loading || multiRunning}
        options={[
          { value: "link", label: "링크", icon: Link2 },
          { value: "text", label: "글 붙여넣기", icon: ClipboardPaste },
          { value: "image", label: "캡처", icon: ImageUp },
          { value: "multi", label: "여러 개", icon: Layers },
        ]}
      />

      {fallbackMessage && (
        <div className="flex gap-2.5 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-foreground" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{fallbackMessage} 공고 글을 붙여넣거나 캡처를 올려 주세요.</p>
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          if (mode === "multi") runMulti();
          else submit(mode);
        }}
      >
        {mode === "link" && (
          <div className="flex flex-col gap-3">
            <Label htmlFor="posting-url" className="px-1">채용 공고 링크</Label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="posting-url"
                type="url"
                inputMode="url"
                placeholder="https://www.saramin.co.kr/…"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setSaved(null); }}
                disabled={loading}
                className="h-12 pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              <span className="text-xs text-muted-foreground">바로 읽는 사이트</span>
              {["사람인", "잡코리아", "원티드", "링커리어", "인크루트"].map((site) => (
                <Badge key={site} variant="secondary">{site}</Badge>
              ))}
            </div>
          </div>
        )}

        {mode === "multi" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="multi-links" className="px-1">채용 공고 링크 <span className="font-normal text-muted-foreground">(한 줄에 하나씩)</span></Label>
              <Textarea
                id="multi-links"
                placeholder={"https://www.saramin.co.kr/…\nhttps://www.wanted.co.kr/…"}
                value={multiLinks}
                onChange={(e) => { setMultiLinks(e.target.value); setJobs([]); }}
                disabled={multiRunning}
                className="min-h-28 rounded-2xl"
              />
            </div>
            <div className="flex flex-col gap-3">
              <span className="px-1 text-sm font-medium">공고 캡처 <span className="font-normal text-muted-foreground">(눌러서 고르거나 끌어다 놓기)</span></span>
              <input ref={multiFileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addMultiFiles(e.target.files); e.target.value = ""; setJobs([]); }} />
              <div className="flex flex-wrap gap-2">
                {multiImages.map((img, i) => (
                  <div key={img.id} className="relative size-20 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                    {/* 기기 안에서만 보여 주는 미리보기 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={`캡처 ${i + 1}`} className="size-full object-cover" />
                    <button
                      type="button"
                      aria-label={`캡처 ${i + 1} 빼기`}
                      disabled={multiRunning}
                      onClick={() => { setMultiImages((prev) => prev.filter((m) => m.id !== img.id)); setJobs([]); }}
                      className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background hover:bg-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {multiTotal < MAX_MULTI && (
                  <button
                    type="button"
                    onClick={() => multiFileRef.current?.click()}
                    disabled={multiRunning}
                    className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input bg-muted/50 text-xs text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Plus className="size-4 text-foreground" />
                    캡처 추가
                  </button>
                )}
              </div>
            </div>
            <p className={cn("px-1 text-xs", multiTotal > MAX_MULTI ? "text-destructive" : "text-muted-foreground")}>
              링크 {multiUrls.length}개 · 캡처 {multiImages.length}장 — 합쳐서 <span className="font-semibold tabular-nums">{multiTotal} / {MAX_MULTI}</span>개
              {multiTotal > MAX_MULTI && " · 5개까지만 넣어 주세요"}
            </p>
          </div>
        )}

        {mode !== "link" && mode !== "multi" && linkToKeep && (
          <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">이 링크도 함께 저장돼요</p>
              <p className="truncate">{linkToKeep}</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="링크 빼기" onClick={() => setUrl("")} disabled={loading}>
              <X />
            </Button>
          </div>
        )}

        {mode === "text" && (
          <div className="flex flex-col gap-3">
            <Label htmlFor="posting-text" className="px-1">공고 글</Label>
            <Textarea
              id="posting-text"
              placeholder={"공고 화면의 글을 통째로 복사해 붙여넣어 주세요.\n예) 근무지 · 고용형태 · 접수기간 · 제출서류 · 전형절차"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              className="min-h-56 rounded-2xl"
            />
          </div>
        )}

        {mode === "image" && (
          <div className="flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {image ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative overflow-hidden rounded-3xl bg-muted"
                disabled={loading}
                aria-label="다른 캡처 고르기"
              >
                {/* 기기 안에서만 보여 주는 미리보기 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="고른 캡처 미리보기" className="mx-auto max-h-80 w-auto" />
                <span className="absolute right-3 bottom-3 rounded-sm bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
                  다른 캡처 고르기
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-input bg-muted/50 text-sm text-muted-foreground transition-colors hover:bg-muted"
                disabled={loading}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-card shadow-soft">
                  <ImageUp className="size-5 text-foreground" />
                </span>
                <span className="font-medium text-foreground">공고 캡처 고르기</span>
                <span className="text-xs">눌러서 고르거나 캡처를 여기로 끌어다 놓으세요</span>
              </button>
            )}
          </div>
        )}

        {/* 평소엔 검정, 마우스를 올렸을 때만 주황 (2026-11-12 사용자 요청) */}
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full bg-foreground text-base text-background hover:bg-primary hover:text-primary-foreground"
          disabled={loading || !canSubmit}
        >
          {loading || multiRunning ? <Loader2 className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
          {loading || multiRunning ? "정리하는 중…" : mode === "multi" && multiTotal > 0 ? `${Math.min(multiTotal, MAX_MULTI)}개 정리하기` : "정리하기"}
        </Button>
      </form>

      {loading && <ExtractProgress />}

      {/* 여러 개: 공고마다 진행 상태 (D-67) */}
      {mode === "multi" && jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2" aria-live="polite">
            {jobs.map((job) => (
              <li key={job.key} className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-sm">
                {job.status === "reading" || job.status === "wait" ? (
                  <Loader2 className={cn("size-4 shrink-0 text-muted-foreground", job.status === "reading" && "animate-spin")} />
                ) : job.status === "ok" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success-foreground" />
                ) : job.status === "saved" ? (
                  <Copy className="size-4 shrink-0 text-warning-foreground" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {job.status === "ok" && job.draft ? `${job.draft.posting.company || "기업명 없음"} · ${job.draft.posting.jobTitle || "직무 없음"}` : job.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {job.status === "wait" && "기다리는 중"}
                    {job.status === "reading" && "읽는 중…"}
                    {job.status === "ok" && `${job.label}에서 정리했어요`}
                    {job.status === "saved" && `이미 저장한 공고예요 · ${job.existing?.company ?? ""}`}
                    {job.status === "fail" && job.message}
                  </p>
                </div>
                {job.status === "saved" && job.existing && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/postings/${job.existing.id}`}>그 공고 보기</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {!multiRunning && (
            readyDrafts.length > 0 ? (
              <Button type="button" size="lg" className="h-12 w-full text-base" onClick={reviewAll}>
                하나씩 확인하기 ({readyDrafts.length}개)
              </Button>
            ) : (
              <p className="px-1 text-sm text-muted-foreground">확인할 공고가 없어요. 링크·캡처를 바꿔 다시 정리해 보세요.</p>
            )
          )}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive-soft px-4 py-3" role="alert">
          <Mascot pose="understand" size={48} hop />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warning px-4 py-3" role="alert">
          <div className="min-w-0 text-sm text-warning-foreground">
            <p className="font-semibold">이미 저장한 공고예요</p>
            <p className="truncate">
              {saved.company} · {saved.jobTitle}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/postings/${saved.id}`}>그 공고 보기</Link>
          </Button>
        </div>
      )}

      <p className="flex items-start gap-1.5 px-1 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        공고 글 속 전화번호·이메일은 지우고 AI에 보내요. 붙여넣은 글은 원문으로 저장돼 나만 볼 수 있고, 캡처는 저장하지 않아요.
      </p>
    </div>
  );
}
