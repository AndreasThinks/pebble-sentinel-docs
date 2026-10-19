// Educational nightly-summary model, not the watch firmware or a health tool.
// Mirrors the documented baseline and episode rules. It deliberately omits
// sensor acquisition, window quality math, storage faults and delivery scheduling.
const median = (a) => {
  const b = [...a].sort((x, y) => x - y),
    m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
};
export function scoreNights(nights) {
  const out = [];
  let state = "NORMAL",
    lastElevated = -2,
    recovery = 0,
    activeEpisode = false;
  nights.forEach((n, i) => {
    const prior = out.filter((r, j) => j >= i - 28 && r.eligible);
    const center = prior.length ? median(prior.map((r) => r.hr)) : null;
    const scale = prior.length
      ? Math.max(
          1.5,
          1.4826 * median(prior.map((r) => Math.abs(r.hr - center))),
        )
      : null;
    const baseline =
      prior.length >= 14
        ? { center, scale, threshold: center + Math.max(4, 2 * scale) }
        : null;
    const valid = n.quality === "valid" && Number.isFinite(n.hr);
    let shown,
      newAlert = false;
    if (!valid) {
      shown = "NO DATA";
      recovery = 0;
    } else if (!baseline) {
      shown = "CALIBRATING";
      state = "NORMAL";
    } else {
      const elevated = n.hr - center >= 4 && (n.hr - center) / scale >= 2;
      const normal = n.hr - center <= 2 || (n.hr - center) / scale <= 1;
      if (elevated) {
        recovery = 0;
        if (activeEpisode) state = "STRAIN";
        else if (state === "WATCH" && lastElevated === i - 1) {
          state = "STRAIN";
          activeEpisode = true;
          newAlert = true;
        } else state = "WATCH";
        lastElevated = i;
      } else if (normal) {
        if (activeEpisode) {
          recovery++;
          if (recovery >= 2) {
            state = "NORMAL";
            activeEpisode = false;
            recovery = 0;
          } else state = "RECOVERING";
        } else state = "NORMAL";
      } else recovery = 0;
      shown = state;
    }
    out.push({
      ...n,
      state: shown,
      baseline,
      priorEligible: prior.length,
      newAlert,
      eligible: valid && ["CALIBRATING", "NORMAL"].includes(shown),
    });
  });
  return out;
}
export function demoNights(
  scenario = "change",
  missing = false,
  motion = false,
) {
  return Array.from({ length: 24 }, (_, i) => {
    let hr = [59.5, 60, 60.5, 60][i % 4];
    if (scenario === "change" && i === 18) hr = 65.5;
    if (scenario === "change" && i === 19) hr = 66;
    const quality =
      i === 18 && missing
        ? "missing"
        : i === 18 && motion
          ? "inadequate"
          : "valid";
    return { hr: quality === "missing" ? null : hr, quality };
  });
}
