import test from "node:test";
import assert from "node:assert/strict";
import { scoreNights } from "../docs/model.mjs";
const night = (hr, extra = {}) => ({ hr, quality: "valid", ...extra });
const steady = (n = 18) =>
  Array.from({ length: n }, (_, i) => night([59.5, 60, 60.5, 60][i % 4]));
const last = (n) => scoreNights(n).at(-1);
test("the current night is excluded from its own personal baseline", () => {
  assert.equal(last([...steady(14), night(90)])?.baseline?.center, 60);
});
test("fourteen prior qualifying nights are required", () => {
  assert.equal(last(steady(14))?.state, "CALIBRATING");
  assert.equal(last(steady(15))?.state, "NORMAL");
});
test("one elevated night is Watch, not an alert", () => {
  const a = last([...steady(), night(65)]);
  assert.equal(a?.state, "WATCH");
  assert.equal(a?.newAlert, false);
});
test("two consecutive qualifying elevated nights create one episode alert", () => {
  const a = last([...steady(), night(65), night(66)]);
  assert.equal(a?.state, "STRAIN");
  assert.equal(a?.newAlert, true);
});
test("a missing night breaks confirmation", () => {
  assert.equal(
    last([
      ...steady(),
      night(65),
      night(null, { quality: "missing" }),
      night(66),
    ])?.state,
    "WATCH",
  );
});
test("insufficient quality also breaks confirmation", () => {
  assert.equal(
    last([
      ...steady(),
      night(65),
      night(66, { quality: "inadequate" }),
      night(66),
    ])?.state,
    "WATCH",
  );
});
test("a small absolute change does not cross the provisional four BPM gate", () => {
  assert.equal(last([...steady(), night(63.9), night(63.9)])?.state, "NORMAL");
});
test("both the absolute and personal-variability gates are required", () => {
  const broad = Array.from({ length: 18 }, (_, i) =>
    night([56, 58, 60, 62, 64, 60][i % 6]),
  );
  assert.equal(last([...broad, night(65), night(65)])?.state, "NORMAL");
});
test("HRV alone never changes detector state", () => {
  assert.equal(
    last([...steady(), night(60, { rmssd: 5 }), night(60, { rmssd: 3 })])
      ?.state,
    "NORMAL",
  );
});
test("re-elevation during recovery remains in the same episode", () => {
  const scored = scoreNights([
    ...steady(),
    night(65),
    night(66),
    night(60),
    night(65),
  ]);
  assert.equal(scored.at(-2)?.state, "RECOVERING");
  assert.equal(scored.at(-1)?.state, "STRAIN");
  assert.equal(scored.filter((n) => n.newAlert).length, 1);
});
test("two normal-band nights complete recovery", () => {
  assert.equal(
    last([...steady(), night(65), night(66), night(60), night(60)])?.state,
    "NORMAL",
  );
});
test("a missing measurement stays unknown rather than displaying normal", () => {
  assert.equal(
    last([...steady(), night(null, { quality: "missing" })])?.state,
    "NO DATA",
  );
});
test("watch and episode nights do not become baseline nights", () => {
  const a = last([...steady(), night(65), night(66), night(60)]);
  assert.equal(a?.priorEligible, 18);
});
