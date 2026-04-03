import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "deploy_commands.ts"],
  format: ["cjs"],
  target: "node18",
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  bundle: true,

  external: ["discord.js", "@discordjs/voice", "youtube-dl-exec"],
});
