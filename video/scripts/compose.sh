#!/usr/bin/env bash
# Compose the Tidecast demo: title → problem card → four recorded demo clips
# (captioned, narrated) → outro card. ffmpeg-only. 1920×1080, 30fps, AAC audio.
#
#   bash scripts/compose.sh
#
# Inputs (already produced):
#   out/clips/{01-market,02-quote,03-mint,04-analytics}.webm   real interaction
#   out/captions/{market,quote,mint,analytics}.png             lower-third overlays
#   out/cards/{title,problem,outro}.png                        branded cards (2x → scaled)
#   out/audio/{p1-problem,p2a-market,p2b-quote,p2c-mint,p2d-analytics,p3-vision}.wav
# Output: out/tidecast-demo.mp4
set -euo pipefail
cd "$(dirname "$0")/.."

FPS=30
W=1920; H=1080
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FONT="/System/Library/Fonts/Supplemental/Arial.ttf"

# Segment hold lengths (seconds). Cards are stills; demo segments use full clip length.
TITLE_DUR=10
PROBLEM_DUR=28
OUTRO_DUR=34

# ── helper: card PNG → segment video with a slow ken-burns zoom + fades ──────────
card_segment() {  # $1=png  $2=dur  $3=out
  ffmpeg -y -loop 1 -i "$1" -t "$2" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},
         zoompan=z='min(1.06,1.0+0.0009*in)':d=1:s=${W}x${H}:fps=${FPS},
         fade=t=in:st=0:d=0.6,fade=t=out:st=$(echo "$2-0.6"|bc):d=0.6,format=yuv420p" \
    -r "$FPS" -an "$3" 2>/dev/null
}

# ── helper: demo clip + caption overlay → segment video (scaled, faded) ──────────
# $4 optional: trim the clip to this many seconds (keeps over-long sweeps tight).
clip_segment() {  # $1=clip  $2=caption_png  $3=out  [$4=trim_secs]
  local trim=(); [ -n "${4:-}" ] && trim=(-t "$4")
  ffmpeg -y -i "$1" ${trim[@]+"${trim[@]}"} -i "$2" \
    -filter_complex "[0:v]scale=${W}:${H},fps=${FPS},setsar=1[v];
                     [v][1:v]overlay=0:0:format=auto,
                     fade=t=in:st=0:d=0.5,format=yuv420p[o]" \
    -map "[o]" -an "$3" 2>/dev/null
}

# ── helper: place a VO wav inside a silent bed of length $2, starting at $3 ───────
seg_audio() {  # $1=vo_wav  $2=seg_dur  $3=start_offset  $4=out
  local ms; ms=$(echo "$3*1000/1"|bc)
  ffmpeg -y -f lavfi -t "$2" -i "anullsrc=r=48000:cl=stereo" -i "$1" \
    -filter_complex "[1:a]aresample=48000,aformat=channel_layouts=stereo,
                     adelay=${ms}|${ms},volume=1.1[vo];
                     [0:a][vo]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]" \
    -map "[a]" -ac 2 -ar 48000 "$4" 2>/dev/null
}
# card with no VO: pure silence bed
silent_audio() {  # $1=dur  $2=out
  ffmpeg -y -f lavfi -t "$1" -i "anullsrc=r=48000:cl=stereo" -ac 2 -ar 48000 "$2" 2>/dev/null
}

echo "▶ building segments…"

# durations of demo clips
d_market=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 out/clips/01-market.webm)
d_quote=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 out/clips/02-quote.webm)
d_mint=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 out/clips/03-mint.webm)
d_analytics=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 out/clips/04-analytics.webm)

# video segments
card_segment out/cards/title.png   "$TITLE_DUR"   "$TMP/v0.mp4"
card_segment out/cards/problem.png "$PROBLEM_DUR" "$TMP/v1.mp4"
clip_segment out/clips/01-market.webm    out/captions/market.png    "$TMP/v2.mp4"
clip_segment out/clips/02-quote.webm     out/captions/quote.png     "$TMP/v3.mp4"
clip_segment out/clips/03-mint.webm      out/captions/mint.png      "$TMP/v4.mp4"
ANALYTICS_DUR=48   # the sweep clip is long; keep the best 48s of live smile + heatmap
clip_segment out/clips/04-analytics.webm out/captions/analytics.png "$TMP/v5.mp4" "$ANALYTICS_DUR"
card_segment out/cards/outro.png   "$OUTRO_DUR"   "$TMP/v6.mp4"

# audio segments (VO timed to each)
silent_audio "$TITLE_DUR"                                   "$TMP/a0.wav"
seg_audio out/audio/p1-problem.wav    "$PROBLEM_DUR"  1.2   "$TMP/a1.wav"
seg_audio out/audio/p2a-market.wav    "$d_market"     1.5   "$TMP/a2.wav"
seg_audio out/audio/p2b-quote.wav     "$d_quote"      1.2   "$TMP/a3.wav"
seg_audio out/audio/p2c-mint.wav      "$d_mint"       0.8   "$TMP/a4.wav"
seg_audio out/audio/p2d-analytics.wav "$ANALYTICS_DUR" 1.5   "$TMP/a5.wav"
seg_audio out/audio/p3-vision.wav     "$OUTRO_DUR"    1.0   "$TMP/a6.wav"

echo "▶ muxing per-segment a/v…"
for i in 0 1 2 3 4 5 6; do
  ffmpeg -y -i "$TMP/v$i.mp4" -i "$TMP/a$i.wav" -c:v copy -c:a aac -b:a 192k -shortest "$TMP/s$i.mp4" 2>/dev/null
done

echo "▶ concatenating…"
: > "$TMP/list.txt"
for i in 0 1 2 3 4 5 6; do echo "file '$TMP/s$i.mp4'" >> "$TMP/list.txt"; done
# re-encode on concat so timestamps stay clean and audio is continuous
ffmpeg -y -f concat -safe 0 -i "$TMP/list.txt" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" \
  -c:a aac -b:a 192k -movflags +faststart \
  out/tidecast-demo.mp4 2>/dev/null

echo "✓ wrote out/tidecast-demo.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height \
  -of default=noprint_wrappers=1 out/tidecast-demo.mp4
