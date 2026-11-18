// Runs in the gallery page so WebDriver transport latency stays outside the samples.
export async function samplePreview(state) {
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const ready = async (check) => {
    for (let i = 0; i < 100; i++) {
      const element = check();
      if (element) return element;
      await delay(50);
    }
    throw new Error("Preview failed to become ready");
  };
  const preview = await ready(() => document.querySelector(".example-frame"));
  if (document.querySelector(".example-links")) {
    const link = [...document.querySelectorAll(".example-links a")].find(
      (a) => (new URL(a.href).searchParams.get("state") || "default") === state,
    );
    if (link && link.getAttribute("aria-current") !== "true") link.click();
  }
  await ready(
    () =>
      !document
        .querySelector(".example-frame [role=status]")
        ?.textContent?.includes("Loading preview") &&
      document.querySelector(".example-frame"),
  );
  const surface = document.querySelector(".example-canvas") || preview;
  surface.scrollIntoView({ block: "center", behavior: "instant" });
  const control = [
    ...surface.querySelectorAll(
      "button:not(:disabled),input:not(:disabled),[role=switch],[role=tab]",
    ),
  ].find(
    (el) =>
      el.getBoundingClientRect().width &&
      el.getAttribute("aria-disabled") !== "true" &&
      !/install|clipboard|copy|share/i.test(
        el.textContent || el.getAttribute("aria-label") || "",
      ),
  );
  const stamps = [await frame()];
  const clickStarted = performance.now();
  if (control) control.click();
  const handlerMs = performance.now() - clickStarted;
  while (stamps.at(-1) - stamps[0] < 800) stamps.push(await frame());
  const intervals = stamps
    .slice(1)
    .map((time, i) => time - stamps[i])
    .sort((a, b) => a - b);
  const q = (n) => intervals[Math.ceil(intervals.length * n) - 1];
  return {
    state,
    control: control
      ? (
          control.getAttribute("aria-label") ||
          control.textContent ||
          control.tagName
        )
          .trim()
          .slice(0, 100)
      : null,
    samples: intervals.length,
    elapsedMs: stamps.at(-1) - stamps[0],
    handlerMs,
    p50Ms: q(0.5),
    p95Ms: q(0.95),
    worstMs: intervals.at(-1),
    fps: (1000 * intervals.length) / (stamps.at(-1) - stamps[0]),
    overBudget: intervals.filter((x) => x > 1000 / 120).length,
    over12ms: intervals.filter((x) => x > 12).length,
  };
}
