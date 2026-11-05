"use client";

import { createContext, useContext } from "react";
import * as realActions from "@/lib/posting-actions";

// 둘러보기 (D-34): 같은 화면 부품을 로그인 없이 쓴다. 저장 대신 성공만 돌려주고, 주소는 /app → /demo 로 바꾼다.

const DemoContext = createContext(false);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>;
}

export const useIsDemo = () => useContext(DemoContext);

// 앱 안의 주소. 둘러보기에서는 /demo 아래로
export function useAppHref() {
  const demo = useIsDemo();
  return (path: string) => (demo && path.startsWith("/app") ? path.replace(/^\/app/, "/demo") : path);
}

const ok = async () => ({ ok: true as const });
const okWithId = async () => ({ ok: true as const, id: crypto.randomUUID() });

// 화면에서 부르는 저장 기능. 둘러보기에서는 아무것도 저장하지 않는다
const demoActions = {
  updatePosting: ok,
  updatePostingMeta: ok,
  deletePosting: ok,
  setStepCompleted: ok,
  setCurrentStep: ok,
  setPrepDone: ok,
  addPrepItem: okWithId,
  updatePrepItem: ok,
  deletePrepItem: ok,
  addSubtask: okWithId,
  updateSubtask: ok,
  deleteSubtask: ok,
} satisfies Partial<Record<keyof typeof realActions, unknown>>;

type PostingActions = Pick<typeof realActions, keyof typeof demoActions>;

export function usePostingActions(): PostingActions {
  return useIsDemo() ? demoActions : realActions;
}
