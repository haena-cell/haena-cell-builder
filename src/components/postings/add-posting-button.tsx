import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddPostingButton() {
  return (
    <>
      <Button size="lg" className="hidden px-3 md:inline-flex" asChild>
        <Link href="/app/new">
          <Plus data-icon="inline-start" />
          공고 넣기
        </Link>
      </Button>
      {/* 휴대폰: 오른쪽 아래 둥근 버튼 */}
      <Button size="icon-lg" className="fixed right-4 bottom-6 z-10 size-14 rounded-full md:hidden" asChild>
        <Link href="/app/new" aria-label="공고 넣기">
          <Plus className="size-6" />
        </Link>
      </Button>
    </>
  );
}
