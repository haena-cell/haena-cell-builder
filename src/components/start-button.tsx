"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StartButton({ className }: { className?: string }) {
  return (
    <Button
      size="lg"
      className={className}
      onClick={() => toast("곧 열려요. 조금만 기다려 주세요!")}
    >
      곧 열려요
    </Button>
  );
}
