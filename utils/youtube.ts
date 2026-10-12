import { Track } from "../constants";
import { AudioPlayer, createAudioResource, StreamType } from "@discordjs/voice";
import youtubedl from "youtube-dl-exec";

export async function fetchTracksByTitleOrUrl(song: string) {
  const trimmedSong = song?.trim();

  if (!trimmedSong) {
    throw new Error("Song title or URL is required");
  }

  const url = URL.canParse(trimmedSong) ? new URL(trimmedSong) : null;

  if (url) {
    return await fetchTracks(url.href);
  }

  return await fetchTracks(null, trimmedSong);
}

export async function fetchTracks(
  url: string | null = null,
  title: string | null = null,
): Promise<Track[]> {
  if (!process.env.API_URL) {
    throw new Error("Missing API_URL environment variable");
  }

  let params: URLSearchParams;

  if (url) {
    params = new URLSearchParams({ url });
  } else if (title) {
    params = new URLSearchParams({ title });
  } else {
    throw new Error("Missing url or title for fetchTracks");
  }

  const response = await fetch(
    `${process.env.API_URL}/discord/get-youtube-tracks?${params}`,
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "<unable to read response>");

    throw new Error(
      `Failed to fetch tracks: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json();
}

export function playYoutube(
  player: AudioPlayer,
  track: Track,
  onDownloadError: (error: unknown) => void,
): void {
  const audio = youtubedl.exec(
    track.url,
    {
      format: "bestaudio/best",
      noPlaylist: true,
      quiet: true,
      noWarnings: true,
      output: "-",
      // @ts-expect-error yt-dlp supports this option; youtube-dl-exec's Flags type omits it.
      extractorArgs: "youtube:player_client=android,ios,mweb",
    },
    {
      stdio: ["ignore", "pipe", "pipe"],
      reject: false,
    },
  );

  void audio
    .then(({ error }) => {
      if (error) {
        onDownloadError(error);
      }
    })
    .catch(onDownloadError);

  if (!audio || !audio.stdout) {
    throw new Error("Unable to create audio stream from URL");
  }

  const resource = createAudioResource(audio.stdout, {
    inputType: StreamType.Arbitrary,
  }) as any;

  player.play(resource);
}
