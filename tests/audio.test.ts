import { playNext } from "../utils/youtube";
import { songQueue } from "../constants";
import * as voice from "@discordjs/voice";
import { AudioPlayerStatus } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";

const mockVoiceChannel = {
  id: "vc-123",
  members: { size: 2 },
};
const mockDestroy = jest.fn();
const mockConnection = {
  joinConfig: { channelId: "vc-123" },
  state: { status: "ready" },
  destroy: mockDestroy,
};

jest.mock("@discordjs/voice", () => ({
  getVoiceConnection: jest.fn(() => mockConnection),
  AudioPlayerStatus: {
    Idle: 1,
    Playing: 2,
  },
  createAudioResource: jest.fn(),
  StreamType: {
    Arbitrary: 1,
  },
}));

jest.mock("child_process", () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: { on: jest.fn() },
    on: jest.fn(),
    kill: jest.fn(),
  }),
}));

jest.mock("child_process", () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: { pipe: jest.fn() },
    on: jest.fn(),
    kill: jest.fn(),
  }),
}));

describe("Playing Music Logic", () => {
  const guildId = "123";

  let mockInteraction = {
    client: {
      guilds: {
        cache: {
          get: jest.fn().mockReturnValue({
            id: guildId,
            name: "Test Guild",
            channels: {
              cache: {
                get: jest.fn().mockReturnValue(mockVoiceChannel),
              },
            },
          }),
        },
      },
    },
    channel: { send: jest.fn() },
    guildId,
  } as any as CommandInteraction;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // // Create a mock interaction
    // mockInteraction = {
    //   guildId: "123",
    //   channel: { send: jest.fn() },
    // };

    // Setup a mock server queue
    songQueue.set(guildId, {
      tracks: [
        { title: "Song 1", url: "https://yt.com/1" },
        { title: "Deleted Song", url: "https://yt.com/2" }, // Should be skipped
        { title: "Song 2", url: "https://yt.com/3" },
      ],
      index: 0,
      player: {
        play: jest.fn(),
        once: jest.fn(),
        on: jest.fn(),
        removeAllListeners: jest.fn(),
        state: { status: "idle" },
      },
      connection: { state: { status: "ready" }, destroy: jest.fn() },
      disconnectTimeout: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // test("should skip a track if title contains 'Deleted'", async () => {
  //   const serverQueue = songQueue.get("123");
  //   serverQueue.index = 1; // Point to 'Deleted Song'

  //   await playNext(mockInteraction);

  //   // Expect index to have advanced past the deleted song
  //   expect(serverQueue.index).toBe(1);
  //   // Expect the player to be playing the NEXT valid song (Song 2)
  //   expect(serverQueue.player.play).toHaveBeenCalled();
  // });

  // test("should disconnect when index exceeds track length", async () => {
  //   jest.useFakeTimers();
  //   const serverQueue = songQueue.get("123");
  //   serverQueue.index = 3; // Beyond the list

  //   await playNext(mockInteraction);

  //   // Fast-forward the DC_IDLE timer
  //   jest.runAllTimers();

  //   expect(serverQueue.connection.destroy).toHaveBeenCalled();
  //   expect(songQueue.has("123")).toBe(false);
  //   jest.useRealTimers();
  // });

  test("should play 2 songs and then disconnect after the idle period", async () => {
    const serverQueue = songQueue.get(guildId)!;
    // 1. Start the first song
    await playNext(mockInteraction);
    expect(serverQueue.player.play).toHaveBeenCalledTimes(1);
    expect(serverQueue.index).toBe(0);

    // 2. Simulate Song 1 ending by triggering the Idle callback manually
    // We grab the callback passed to player.once('idle', ...)
    const idleCallback = (serverQueue.player.once as jest.Mock).mock.calls.find(
      (call) => call[0] === AudioPlayerStatus.Idle
    )[1];

    idleCallback();

    // 3. Fast-forward past the DC_IDLE time (e.g., 30s)
    jest.advanceTimersByTime(31000);

    // Now playNext is called again via the timeout
    // This should start Song 2
    expect(serverQueue.index).toBe(2);
    expect(serverQueue.player.play).toHaveBeenCalledTimes(2);

    // 4. Simulate Song 2 ending
    const secondIdleCall = (
      serverQueue.player.once as jest.Mock
    ).mock.calls.find((call) => call[0] === AudioPlayerStatus.Idle)[1];

    jest.advanceTimersByTime(12000);
    mockVoiceChannel.members.size = 1;
    secondIdleCall();

    jest.advanceTimersByTime(32000);
    // Verify destruction
    expect(mockDestroy).toHaveBeenCalled();
    expect(songQueue.has(guildId)).toBe(false);
  });
});
