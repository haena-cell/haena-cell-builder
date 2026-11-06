// 키워드 읽기 점수표: node tests/score-keywords.ts [-v]
import { readKeywordFields } from "../src/lib/posting-keywords.ts";
import { FIXTURES, type Expected } from "./keyword-fixtures.ts";

const NOW = new Date("2026-11-07T00:00:00+09:00");
const verbose = process.argv.includes("-v");
const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const totals: Record<string, [number, number]> = {};

for (const { name, text, expect } of FIXTURES) {
  const got = readKeywordFields(text, NOW) as Record<string, unknown>;
  for (const key of Object.keys(expect) as (keyof Expected)[]) {
    const want = expect[key];
    const value = got[key];
    let ok: boolean;
    if (Array.isArray(want)) ok = key === "requiredDocs" ? same([...(value as string[] ?? [])].sort(), [...want].sort()) : same((value as string[]) ?? [], want);
    else if (key === "jobTitle" || key === "location") ok = typeof value === "string" && value.includes(want as string);
    else ok = (value ?? null) === (want ?? null);
    (totals[key] ??= [0, 0])[1]++;
    if (ok) totals[key][0]++;
    else if (verbose) console.log(`  ✗ ${name} · ${key}: 정답 ${JSON.stringify(want)} / 결과 ${JSON.stringify(value)}`);
  }
}
let right = 0, all = 0;
for (const [key, [ok, n]] of Object.entries(totals)) {
  console.log(`${key.padEnd(16)} ${ok}/${n}`);
  right += ok; all += n;
}
console.log(`전체 ${right}/${all} (${Math.round((right / all) * 100)}%)`);
