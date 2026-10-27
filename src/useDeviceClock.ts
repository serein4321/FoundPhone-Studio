import { useEffect, useState } from "react";
export function taiwanClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return { date: part("year") + "-" + part("month") + "-" + part("day"),
    time: part("hour") + ":" + part("minute") };
}
export function useDeviceClock(enabled: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    const sync = () => setNow(new Date());
    const timer = window.setInterval(sync, 1000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [enabled]);
  return taiwanClock(now);
}
