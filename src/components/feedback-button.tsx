"use client";

import { useState } from "react";
import { Mascot } from "@/components/mascot";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendFeedback } from "@/lib/feedback-actions";

// [의견 보내기] 버튼 + 창 (D-36). 랜딩·로그인·앱 메뉴·둘러보기에서 함께 쓴다
export function FeedbackButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const result = await sendFeedback({ message, contact, website, page: window.location.pathname });
    setSending(false);
    if (!result.ok) return setError(result.message);
    setMessage("");
    setContact("");
    setOpen(false);
    toast("의견을 보냈어요. 고마워요!");
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className={className} onClick={() => setOpen(true)}>
        {/* 편지를 문 강아지 (2026-11-12 사용자 요청) */}
        <Mascot pose="ok" size={26} className="-my-1 -ml-0.5" />
        의견 보내기
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>의견 보내기</DialogTitle>
            <DialogDescription>Hurdle은 웹 베타 버전이에요. 불편한 점이나 바라는 기능을 편하게 알려 주세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-message" className="px-1">의견</Label>
              <Textarea
                id="feedback-message"
                className="min-h-36 rounded-2xl"
                value={message}
                maxLength={2000}
                placeholder="예) 달력에서 지난 공고는 흐리게 보였으면 좋겠어요"
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-contact" className="px-1">답변받을 이메일 (선택)</Label>
              <Input
                id="feedback-contact"
                type="email"
                value={contact}
                maxLength={200}
                placeholder="답변이 필요할 때만 적어 주세요"
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            {/* 자동 프로그램 걸러내기: 사람에게는 보이지 않는 칸 */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            {error && <p className="rounded-2xl bg-destructive-soft px-4 py-3 text-sm text-destructive" role="alert">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="lg" onClick={() => setOpen(false)}>취소</Button>
              <Button type="submit" size="lg" className="px-6" disabled={sending || !message.trim()}>
                {sending ? "보내는 중…" : "보내기"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
