export type Track = {
  title: string;
  url: string;
};

export type RadioQueueItem = {
  type: "radio";
  title: string;
  url: string;
};

export type QueueItem = Track | RadioQueueItem;

export function isRadioQueueItem(item: QueueItem): item is RadioQueueItem {
  return "type" in item && item.type === "radio";
}

export interface ServerQueue {
  tracks: QueueItem[];
  index: number;
  disconnectTimeout: NodeJS.Timeout | null;
  disconnectInterval?: NodeJS.Timeout | null;
  connection: any;
  player: any;
  hasAnnounced?: boolean;
  isLooping?: boolean;
  isRadio?: boolean;
}

export const songQueue = new Map<string, ServerQueue>();
