"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardPaste, ImageUp, Link2, Loader2, Lock, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Segmented } from "@/components/postings/segmented";
import type { ExtractInput, ExtractResult } from "@/lib/extract-posting";
import { findSavedByLink, type PostingSummary } from "@/lib/posting-actions";
import { saveDraft, type DraftSource } from "@/lib/practice-store";

type Mode = "link" | "text" | "image";

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
  const router = useRouter();

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

  const canSubmit = mode === "link" ? !!url.trim() : mode === "text" ? !!text.trim() : !!image;

  return (
    <div className="flex flex-col gap-5">
      <Segmented
        label="넣는 방법"
        value={mode}
        onChange={switchMode}
        disabled={loading}
        options={[
          { value: "link", label: "링크", icon: Link2 },
          { value: "text", label: "글 붙여넣기", icon: ClipboardPaste },
          { value: "image", label: "캡처", icon: ImageUp },
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
          if (canSubmit) submit(mode);
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
                className="h-12 rounded-full pl-10"
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

        {mode !== "link" && linkToKeep && (
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
                <span className="absolute right-3 bottom-3 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
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
                <span className="text-xs">휴대폰 사진첩이나 컴퓨터의 캡처 이미지</span>
              </button>
            )}
          </div>
        )}

        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={loading || !canSubmit}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
          {loading ? "정리하는 중…" : "정리하기"}
        </Button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3" role="status">
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          <div className="text-sm">
            <p className="font-medium">공고를 읽고 있어요</p>
            <p className="text-xs text-muted-foreground">페이지 정보를 먼저 읽고, 빈 칸은 AI가 채워요. 보통 5~20초 걸려요.</p>
          </div>
        </div>
      )}
      {error && (
        <p className="rounded-2xl bg-destructive-soft px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
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
