export type Track = {
  title: string;
  url: string;
};

export interface ServerQueue {
  tracks: Track[];
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
