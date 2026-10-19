import { scoreNights, demoNights } from "./model.mjs";
const $ = (id) => document.getElementById(id);
const slider = $("night-slider");
let scenario = "change";
const color = {
  NORMAL: "#9eddb6",
  WATCH: "#f0be72",
  STRAIN: "#f0be72",
  RECOVERING: "#8adbe9",
  CALIBRATING: "#8adbe9",
  "NO DATA": "#a3b4b9",
};
const words = {
  NORMAL: [
    "Within your current reference.",
    "The selected night does not create a qualifying strain signal. “Normal” is not a medical all-clear.",
  ],
  WATCH: [
    "One night is not a pattern.",
    "One qualifying elevated night enters Watch. Confirmation needs another elevated night on the very next calendar night.",
  ],
  STRAIN: [
    "A change that persisted.",
    "Two consecutive qualifying elevated nights created a strain episode. The cause is unknown: the app cannot distinguish illness from other physiological strain.",
  ],
  RECOVERING: [
    "Heading back toward your usual.",
    "One normal-band night starts recovery. A second consecutive normal-band night completes it. Re-elevation before then stays in the same episode.",
  ],
  CALIBRATING: [
    "First, learn your usual.",
    "The reference needs 14 eligible prior nights inside 28 days. The current night cannot be part of its own comparison.",
  ],
  "NO DATA": [
    "Unknown means unknown.",
    "The selected night is missing or lacks enough clean data. It is not silently filled in, and cannot confirm an elevated streak.",
  ],
};
function chart(nights, index, current) {
  const x = (i) => 42 + i * 26,
    y = (v) => 222 - (v - 52) * 10;
  let out = "";
  for (const v of [55, 60, 65, 70])
    out += `<line x1="40" x2="654" y1="${y(v)}" y2="${y(v)}" stroke="#29404a" stroke-width="1"/><text x="27" y="${y(v) + 4}" fill="#a3b4b9" font-size="10" text-anchor="end" font-family="monospace">${v}</text>`;
  for (const i of [0, 6, 13, 19, 23])
    out += `<text x="${x(i)}" y="253" fill="#a3b4b9" font-size="10" text-anchor="middle" font-family="monospace">${i + 1}</text>`;
  if (current.baseline) {
    const b = current.baseline;
    out += `<rect x="40" y="${y(b.center + 2)}" width="614" height="40" fill="#8adbe912"/><line x1="40" x2="654" y1="${y(b.center)}" y2="${y(b.center)}" stroke="#8adbe96b" stroke-dasharray="4 5"/><line x1="40" x2="654" y1="${y(b.threshold)}" y2="${y(b.threshold)}" stroke="#f0be7266" stroke-dasharray="2 6"/>`;
  }
  out += `<line x1="${x(index)}" x2="${x(index)}" y1="22" y2="230" stroke="#8adbe93f" stroke-dasharray="3 5"/>`;
  nights.slice(0, index + 1).forEach((n, i) => {
    if (n.quality !== "valid") {
      out +=
        n.quality === "missing"
          ? `<path d="M${x(i) - 4} 222h8" stroke="#a3b4b9" stroke-width="2"/>`
          : `<circle cx="${x(i)}" cy="222" r="4" stroke="#a3b4b9" fill="#09151d"/>`;
      return;
    }
    const previous = nights[i - 1];
    if (i && previous.quality === "valid")
      out += `<line x1="${x(i - 1)}" y1="${y(previous.hr)}" x2="${x(i)}" y2="${y(n.hr)}" stroke="#8adbe9" stroke-width="2.5"/>`;
    out += `<circle cx="${x(i)}" cy="${y(n.hr)}" r="${i === index ? 6 : 3.5}" fill="${color[n.state]}" stroke="#09151d" stroke-width="2"/>`;
    if (i === index)
      out += `<circle cx="${x(i)}" cy="${y(n.hr)}" r="11" fill="none" stroke="${color[n.state]}" opacity=".35"/>`;
  });
  $("chart-content").innerHTML = out;
  $("chart-desc").textContent =
    `Synthetic timeline through night ${index + 1}. State: ${current.state}. ${current.quality === "valid" ? `Nightly heart rate ${current.hr.toFixed(1)} bpm.` : "No qualifying measurement."} This is an educational example, not health data.`;
}
function render() {
  const index = Number(slider.value) - 1;
  const nights = scoreNights(
    demoNights(
      scenario,
      $("missing-toggle").checked,
      $("motion-toggle").checked,
    ),
  );
  const current = nights[index],
    c = color[current.state];
  $("night-label").textContent = `NIGHT ${index + 1} / 24`;
  $("slider-value").textContent = String(index + 1);
  slider.setAttribute(
    "aria-valuetext",
    `Night ${index + 1} of 24: ${current.state.toLowerCase()}`,
  );
  $("result-state").textContent = current.state;
  $("result-state").style.color = c;
  $("result-state").style.borderColor = c;
  $("result-state").style.background = `${c}14`;
  $("result-title").textContent = words[current.state][0];
  $("result-explanation").textContent = words[current.state][1];
  $("current-hr").innerHTML =
    current.quality === "valid"
      ? `${current.hr.toFixed(1)} <small>bpm</small>`
      : "-- <small>unknown</small>";
  $("baseline-hr").innerHTML = current.baseline
    ? `${current.baseline.center.toFixed(1)} <small>bpm</small>`
    : `${Math.min(current.priorEligible, 14)}<small> / 14 nights</small>`;
  $("delivery-note").textContent = current.newAlert
    ? "One eligible episode notice. In the real app, delivery waits for the configured daytime window."
    : current.state === "WATCH"
      ? "No new notice. A missing or inadequate night breaks confirmation."
      : current.state === "STRAIN"
        ? "Same episode. No repeat episode notice."
        : current.state === "CALIBRATING"
          ? `${current.priorEligible} eligible prior nights. Calibration is not a score.`
          : current.state === "NO DATA"
            ? "No usable summary here. Missing data is not normal data."
            : "No new episode notice on this night.";
  chart(nights, index, current);
}
for (const b of document.querySelectorAll("[data-scenario]"))
  b.addEventListener("click", () => {
    scenario = b.dataset.scenario;
    slider.value = "20";
    for (const other of document.querySelectorAll("[data-scenario]"))
      other.setAttribute("aria-pressed", String(other === b));
    render();
  });
slider.addEventListener("input", render);
$("missing-toggle").addEventListener("change", render);
$("motion-toggle").addEventListener("change", render);
render();
