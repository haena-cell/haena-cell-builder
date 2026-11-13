"use client";

import { createContext, useContext } from "react";
import * as realActions from "@/lib/posting-actions";
import { track } from "@/lib/analytics";

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
const okWithSteps = async (_id: string, _fields: unknown, items: { id: string; name: string; completedAt?: string | null }[]) => ({
  ok: true as const,
  steps: items.map((s) => ({ id: s.id, name: s.name, completedAt: s.completedAt ?? null })),
});

// 화면에서 부르는 저장 기능. 둘러보기에서는 아무것도 저장하지 않는다
const demoActions = {
  updatePosting: ok,
  updatePostingFull: okWithSteps,
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
  updateMemo: ok,
  setPeriod: ok,
} satisfies Partial<Record<keyof typeof realActions, unknown>>;

type PostingActions = Pick<typeof realActions, keyof typeof demoActions>;

// 이탈 분석(D-75): 단계 완료·할 일 체크를 한곳에서 기록한다 (무엇을 체크했는지는 보내지 않음)
function withTracking(actions: PostingActions, demo: boolean): PostingActions {
  return {
    ...actions,
    setStepCompleted: async (stepId, completed) => {
      const result = await actions.setStepCompleted(stepId, completed);
      if (result.ok && completed) track("step_done", { demo });
      return result;
    },
    setPrepDone: async (itemId, done) => {
      const result = await actions.setPrepDone(itemId, done);
      if (result.ok && done) track("todo_done", { demo, kind: "item" });
      return result;
    },
    updateSubtask: async (...args: Parameters<PostingActions["updateSubtask"]>) => {
      const result = await actions.updateSubtask(...args);
      if (result.ok && args[1].done === true) track("todo_done", { demo, kind: "sub" });
      return result;
    },
  };
}

const trackedReal = withTracking(realActions, false);
const trackedDemo = withTracking(demoActions, true);

export function usePostingActions(): PostingActions {
  return useIsDemo() ? trackedDemo : trackedReal;
}
