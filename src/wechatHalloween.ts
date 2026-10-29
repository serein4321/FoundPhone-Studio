import { makeItem, type Item } from "./schema";

export const HALLOWEEN_MOM = "媽媽🐈";
export const HALLOWEEN_DAD = "爸爸🐈‍⬛";

export type HalloweenReply = {
  thread: string;
  body: string;
  time: string;
};

export function decodeHalloweenReply(raw: string): HalloweenReply | null {
  try {
    const entry: unknown = JSON.parse(raw);
    if (
      Array.isArray(entry) &&
      entry.length === 3 &&
      entry.every((value) => typeof value === "string")
    ) {
      return {
        thread: entry[0] as string,
        body: entry[1] as string,
        time: entry[2] as string,
      };
    }
  } catch {
    // A damaged local entry must not prevent existing messages from loading.
  }
  return null;
}

export function halloweenCanStart(
  existingSent: string[],
  items: Item[],
  momVideoFinished: boolean,
): boolean {
  if (!momVideoFinished) return false;
  // The earlier guinea-pig conversation ends only after two free replies
  // in Dad's WeChat thread. Do not unlock this new chapter beforehand.
  if (!items.some((item) => item.id === "wx-dad-guinea-05-dad-one-pig"))
    return false;
  return (
    existingSent
      .map(decodeHalloweenReply)
      .filter((entry) => entry?.thread === HALLOWEEN_DAD).length >= 2
  );
}

export function halloweenReplied(
  replies: string[],
  thread: string,
): boolean {
  return replies.some(
    (raw) => decodeHalloweenReply(raw)?.thread === thread,
  );
}

export function halloweenTimeline(
  items: Item[],
  replies: string[],
  thread: string,
  playerName: string,
  canStart: boolean,
  creator = false,
  dadOpened = false,
): Item[] {
  const halloween = new Map(
    items
      .filter((item) => item.meta.halloweenStep)
      .map((item) => [item.meta.halloweenStep, item]),
  );
  if (!canStart && !creator) return [];

  const threadReplies = replies
    .map(decodeHalloweenReply)
    .filter(
      (entry): entry is HalloweenReply =>
        Boolean(entry && entry.thread === thread),
    )
    .map((entry, index) =>
      makeItem({
        id: `local-halloween-${thread === HALLOWEEN_MOM ? "mom" : "dad"}-${index}`,
        title: thread,
        body: entry.body,
        sender: playerName,
        time: entry.time,
        outgoing: true,
        meta: { local: "true", halloweenReply: "true" },
      }),
    );
  const result: Item[] = [];
  const append = (step: string) => {
    const item = halloween.get(step);
    if (item) result.push(item);
  };

  if (thread === HALLOWEEN_MOM) {
    append("mom-question");
    if (threadReplies.length > 0 || creator) {
      if (threadReplies[0]) result.push(threadReplies[0]);
      append("mom-film");
      append("mom-fear");
      append("mom-my-reaction");
      append("mom-emojis");
      result.push(...threadReplies.slice(1));
    }
  } else if (
    thread === HALLOWEEN_DAD &&
    (creator || halloweenReplied(replies, HALLOWEEN_MOM))
  ) {
    append("dad-warning");
    // The notification is visible in the chat list; the following messages
    // become visible only when the player chooses to open Dad's conversation.
    if (dadOpened || creator) {
      append("dad-my-question");
      append("dad-asked");
      if (threadReplies.length >= 1 || creator) {
        if (threadReplies[0]) result.push(threadReplies[0]);
        append("dad-fear");
      }
      if (threadReplies.length >= 2 || creator) {
        if (threadReplies[1]) result.push(threadReplies[1]);
        append("dad-gift");
        result.push(...threadReplies.slice(2));
      }
    }
  }
  return result;
}
