"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardPaste, ImageUp, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

  async function submit(from: Mode) {
    const input: ExtractInput | null =
      from === "link"
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
      if (input.kind === "link") {
        const existing = await findSavedByLink(input.url);
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
        const source: DraftSource =
          input.kind === "link"
            ? { kind: "link", url: input.url }
            : input.kind === "image"
              ? { kind: "image", previewDataUrl: input.dataUrl }
              : { kind: "text" };
        if (!saveDraft({ posting: data.posting, isExample: data.isExample, source, hint: data.hint })) {
          setError("정리 결과를 옮기지 못했어요. 다시 시도해 주세요.");
          return;
        }
        router.push("/app/new/review");
        return;
      }
    } catch {
      setError("인터넷 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 링크 */}
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit("link");
        }}
      >
        <Label htmlFor="posting-url">공고 링크</Label>
        <div className="flex gap-2">
          <Input
            id="posting-url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setSaved(null); }}
            disabled={loading}
            className="h-10 flex-1"
          />
          <Button type="submit" size="lg" className="h-10 px-4" disabled={loading || !url.trim()}>
            {loading && mode === "link" ? <Loader2 className="animate-spin" /> : <Link2 data-icon="inline-start" />}
            정리하기
          </Button>
        </div>
        {!fallbackMessage && mode === "link" && (
          <p className="text-xs text-muted-foreground">
            링크가 없으면?{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => switchMode("text")}>
              글 붙여넣기
            </button>{" "}
            ·{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => switchMode("image")}>
              캡처 올리기
            </button>
          </p>
        )}
      </form>

      {fallbackMessage && (
        <div className="flex gap-2 rounded-xl bg-warning px-3 py-2.5 text-sm text-warning-foreground" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            {fallbackMessage} 공고 글을 붙여넣거나 캡처를 올려 주세요.
          </p>
        </div>
      )}

      {/* 글 붙여넣기 · 캡처 올리기 */}
      {mode !== "link" && (
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2" role="tablist">
            <Button
              type="button"
              variant="outline"
              size="lg"
              role="tab"
              aria-selected={mode === "text"}
              className={cn(mode === "text" && "border-primary bg-muted")}
              onClick={() => switchMode("text")}
              disabled={loading}
            >
              <ClipboardPaste data-icon="inline-start" />글 붙여넣기
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              role="tab"
              aria-selected={mode === "image"}
              className={cn(mode === "image" && "border-primary bg-muted")}
              onClick={() => switchMode("image")}
              disabled={loading}
            >
              <ImageUp data-icon="inline-start" />캡처 올리기
            </Button>
          </div>

          {mode === "text" ? (
            <Textarea
              aria-label="공고 글"
              placeholder="공고 글을 여기에 붙여넣어 주세요"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              className="min-h-48"
            />
          ) : (
            <div className="flex flex-col gap-2">
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
                  className="overflow-hidden rounded-xl border border-border"
                  disabled={loading}
                >
                  {/* 기기 안에서만 보여 주는 미리보기 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="고른 캡처 미리보기" className="mx-auto max-h-80 w-auto" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input text-sm text-muted-foreground hover:bg-muted"
                  disabled={loading}
                >
                  <ImageUp className="size-5" />
                  사진첩에서 캡처 고르기
                </button>
              )}
              <p className="text-xs text-muted-foreground">캡처는 정리에만 쓰고 저장하지 않아요.</p>
            </div>
          )}

          <Button
            type="button"
            size="lg"
            className="h-10"
            onClick={() => submit(mode)}
            disabled={loading || (mode === "text" ? !text.trim() : !image)}
          >
            {loading && <Loader2 className="animate-spin" />}
            정리하기
          </Button>
        </section>
      )}

      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" />
          공고를 읽는 중… 10~20초 걸려요
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning px-3 py-3" role="alert">
          <div className="min-w-0 text-sm text-warning-foreground">
            <p className="font-semibold">이미 저장한 공고예요</p>
            <p className="truncate">
              {saved.company} · {saved.jobTitle}
            </p>
          </div>
          <Button variant="outline" size="lg" className="bg-card px-3" asChild>
            <Link href={`/app/postings/${saved.id}`}>그 공고 보기</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
