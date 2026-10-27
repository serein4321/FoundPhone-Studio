/* Adapted from chukjosh/IOS-and-Android-on-the-Web, MIT.
 * Copyright (c) 2025 Joshua Chukwurah. See licenses/ios-web/chukjosh-MIT.txt.
 * components/lock-screen.tsx at 914f7ef8f902821964b14b85a2b410b0606f2d0e.
 * Uses the existing Motion dependency, local device coordinates and click access.
 */
import { useState } from "react";
import { motion } from "motion/react";
export function UnlockHandle({ onUnlock }: { onUnlock: () => void }) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  return (
    <motion.button
      className="unlock-btn swipe-unlock"
      aria-label="輕觸解鎖"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDrag={(_, info) =>
        setSwipeProgress(Math.min(Math.max(-info.offset.y / 100, 0), 1))
      }
      onDragEnd={() => {
        if (swipeProgress > 0.5) onUnlock();
        setSwipeProgress(0);
      }}
      onClick={onUnlock}
      style={{ opacity: 1 - swipeProgress * 0.5 }}
    >
      向上輕掃以開啟
    </motion.button>
  );
}
