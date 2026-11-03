// ═══════════════════════════════════════════════════════════════════════════════
// === AETERNA VIDEO CANVAS SYNTHESIZER: HIGH-SPEED 3D SCRUBBER PIPELINE ===
// ═══════════════════════════════════════════════════════════════════════════════
// Architect: Dimitar Prodromov (ID 101327948) | Pomorie HQ
// Authority: 0x41_45_54_45_52_4e_41_5f_4c_4f_47_4f_53_5f_44_49_4d_49_54_41_52_5f_50_52_4f_44_52_4f_4d_56_21
// Substrate: BARE-METAL RUST / AVX-512 / RAYON / ENTROPY(0.0000)
// ═══════════════════════════════════════════════════════════════════════════════

use rayon::prelude::*;
use std::env;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

#[derive(Debug, Clone)]
pub struct VideoCanvasConfig {
    pub input_path: PathBuf,
    pub output_dir: PathBuf,
    pub target_frames: usize,
    pub target_width: u32,
    pub target_height: u32,
    pub quality: u32,
    pub title: String,
    pub subtitle: String,
}

impl Default for VideoCanvasConfig {
    fn default() -> Self {
        Self {
            input_path: PathBuf::new(),
            output_dir: PathBuf::from("./video_canvas_output"),
            target_frames: 120,
            target_width: 1280,
            target_height: 720,
            quality: 80,
            title: "AETERNA // SPATIAL CANVAS ENGINE".to_string(),
            subtitle: "Apple / Awwwards-Level 3D Video Scrubber".to_string(),
        }
    }
}

fn print_banner() {
    println!(r#"
 ╔══════════════════════════════════════════════════════════════════════════╗
 ║  🔱 AETERNA HIGH-SPEED VIDEO CANVAS SYNTHESIZER v3.0                     ║
 ║  Authority: 0x41_45_54_45_52_4e_41_5f_4c_4f_47_4f_53_5f_44_49_4d_49_54... ║
 ║  Substrate: Native Rust / Rayon / FFmpeg Lanczos / libwebp / WebGL2      ║
 ╚══════════════════════════════════════════════════════════════════════════╝
"#);
}

fn get_video_duration(video_path: &Path) -> Result<f64, String> {
    let output = Command::new("ffprobe")
        .args([
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path.to_str().ok_or("Invalid video path")?,
        ])
        .output()
        .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

    if !output.status.success() {
        return Err(format!("ffprobe exited with error: {}", String::from_utf8_lossy(&output.stderr)));
    }

    let duration_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    duration_str.parse::<f64>().map_err(|e| format!("Could not parse duration '{}': {}", duration_str, e))
}

pub fn extract_webp_frames(config: &VideoCanvasConfig) -> Result<(usize, u64), String> {
    let frames_dir = config.output_dir.join("frames");
    fs::create_dir_all(&frames_dir).map_err(|e| format!("Failed to create frames directory: {}", e))?;

    let duration = get_video_duration(&config.input_path).unwrap_or(8.0);
    let effective_fps = (config.target_frames as f64 / duration).max(1.0);

    println!("[SYNTH PIPELINE]: Input Video: {:?}", config.input_path);
    println!("[SYNTH PIPELINE]: Duration: {:.2}s | Target Frames: {} | Calculated FPS: {:.3}", duration, config.target_frames, effective_fps);
    println!("[SYNTH PIPELINE]: Resolution: {}x{} | libwebp Quality: {}", config.target_width, config.target_height, config.quality);

    let vf_filter = format!("fps={:.3},scale={}:{}:flags=lanczos", effective_fps, config.target_width, config.target_height);
    let output_pattern = frames_dir.join("frame_%04d.webp");

    let t0 = Instant::now();
    let status = Command::new("ffmpeg")
        .args([
            "-y",
            "-i", config.input_path.to_str().unwrap(),
            "-vf", &vf_filter,
            "-vframes", &config.target_frames.to_string(),
            "-vcodec", "libwebp",
            "-quality", &config.quality.to_string(),
            "-compression_level", "6",
            "-preset", "photo",
            output_pattern.to_str().unwrap(),
        ])
        .status()
        .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

    if !status.success() {
        return Err("ffmpeg frame extraction failed".to_string());
    }

    let elapsed = t0.elapsed();

    // Audit generated frames using Rayon parallel directory scan
    let entries: Vec<PathBuf> = fs::read_dir(&frames_dir)
        .map_err(|e| format!("Failed to read frames dir: {}", e))?
        .filter_map(|e| e.ok().map(|d| d.path()))
        .filter(|p| p.extension().map(|ext| ext == "webp").unwrap_or(false))
        .collect();

    let total_bytes: u64 = entries.par_iter()
        .map(|p| fs::metadata(p).map(|m| m.len()).unwrap_or(0))
        .sum();

    let count = entries.len();
    let mb = total_bytes as f64 / (1024.0 * 1024.0);
    let avg_kb = if count > 0 { (total_bytes as f64 / count as f64) / 1024.0 } else { 0.0 };

    println!("  >> Frame Slicing Complete in {:?}: {} frames extracted ({:.2} MB total, {:.1} KB/frame)", elapsed, count, mb, avg_kb);
    Ok((count, total_bytes))
}

pub fn generate_scrollytelling_template(config: &VideoCanvasConfig, frame_count: usize) -> Result<(), String> {
    let html_path = config.output_dir.join("index.html");

    let html_content = format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{title} // AETERNA 3D Video Scrubber</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #000000;
      --card-bg: rgba(10, 12, 14, 0.75);
      --gold: #d4af37;
      --neon-cyan: #00e5ff;
      --neon-magenta: #e024c3;
      --text: #ffffff;
      --text-dim: #7a848d;
      --font-display: 'Cinzel', serif;
      --font-sans: 'Plus Jakarta Sans', sans-serif;
      --font-mono: 'Space Mono', monospace;
    }}
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      overflow-x: hidden;
      min-height: 250vh;
    }}
    .hero-stage {{
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }}
    .canvas-container {{
      position: relative;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      cursor: grab;
    }}
    .canvas-container:active {{ cursor: grabbing; }}
    #scrubberCanvas {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }}
    #glShaderCanvas {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      mix-blend-mode: screen;
      pointer-events: none;
    }}
    .hud-overlay {{
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 32px 48px;
    }}
    .hud-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .brand-pill {{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 18px;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }}
    .live-dot {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--neon-cyan);
      box-shadow: 0 0 10px var(--neon-cyan);
      animation: pulseDot 2s infinite;
    }}
    @keyframes pulseDot {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.35; }} }}
    .telemetry-pill {{
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.1em;
      color: var(--neon-cyan);
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 229, 255, 0.25);
      border-radius: 9999px;
      padding: 8px 16px;
    }}
    .hud-center {{
      text-align: center;
    }}
    .hero-title {{
      font-family: var(--font-display);
      font-size: clamp(38px, 5.5vw, 76px);
      font-weight: 400;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-shadow: 0 4px 30px rgba(0, 0, 0, 0.85);
    }}
    .hero-sub {{
      font-size: 14px;
      letter-spacing: 0.2em;
      color: var(--gold);
      text-transform: uppercase;
      margin-top: 10px;
    }}
    .hud-bottom {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }}
    .scrub-track-wrap {{
      pointer-events: auto;
      flex: 1;
      max-width: 480px;
      background: rgba(10, 12, 14, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 12px 18px;
    }}
    .scrub-bar-meta {{
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--text-dim);
      margin-bottom: 8px;
    }}
    .scrub-progress-outer {{
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      cursor: pointer;
    }}
    .scrub-progress-fill {{
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, var(--neon-magenta), var(--neon-cyan));
      transition: width 0.05s linear;
    }}
    .scroll-spacer {{
      height: 250vh;
      pointer-events: none;
    }}
  </style>
</head>
<body>

  <div class="hero-stage">
    <div class="canvas-container" id="canvasContainer">
      <canvas id="scrubberCanvas"></canvas>
      <canvas id="glShaderCanvas"></canvas>
    </div>
  </div>

  <div class="hud-overlay">
    <div class="hud-top">
      <div class="brand-pill">
        <span class="live-dot"></span>
        <span>{title}</span>
      </div>
      <div class="telemetry-pill" id="telemetryPill">
        60 FPS &bull; FRAME 001/{frame_count} &bull; DUAL-MODE
      </div>
    </div>

    <div class="hud-center">
      <h1 class="hero-title">{title}</h1>
      <p class="hero-sub">{subtitle}</p>
    </div>

    <div class="hud-bottom">
      <div class="scrub-track-wrap">
        <div class="scrub-bar-meta">
          <span id="interactionModeLabel">MODE: AMBIENT CINEMATIC</span>
          <span id="frameCounterLabel">001 / {frame_count}</span>
        </div>
        <div class="scrub-progress-outer" id="scrubProgressOuter">
          <div class="scrub-progress-fill" id="scrubProgressFill"></div>
        </div>
      </div>
      <div class="brand-pill" style="font-size: 9.5px;">
        <span>AVX-512 &bull; ZERO LATENCY</span>
      </div>
    </div>
  </div>

  <div class="scroll-spacer"></div>

  <script>
  (function initAeternaScrubber() {{
    'use strict';
    const TOTAL_FRAMES = {frame_count};
    const canvas = document.getElementById('scrubberCanvas');
    const ctx = canvas.getContext('2d', {{ alpha: false }});
    const glCanvas = document.getElementById('glShaderCanvas');
    const container = document.getElementById('canvasContainer');
    const progressFill = document.getElementById('scrubProgressFill');
    const progressOuter = document.getElementById('scrubProgressOuter');
    const modeLabel = document.getElementById('interactionModeLabel');
    const frameLabel = document.getElementById('frameCounterLabel');
    const telemetryPill = document.getElementById('telemetryPill');

    const frames = [];
    let loadedCount = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartFrame = 0;
    let targetFrame = 0;
    let currentFrame = 0;
    let lastActiveTime = performance.now();
    let isIdle = true;
    let fps = 60, lastFpsTime = performance.now(), frameCount = 0;

    function resize() {{
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      glCanvas.width = window.innerWidth;
      glCanvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }}
    window.addEventListener('resize', resize);
    resize();

    // Preload frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {{
      const img = new Image();
      const pad = String(i).padStart(4, '0');
      img.src = './frames/frame_' + pad + '.webp';
      img.onload = () => {{
        loadedCount++;
        if (loadedCount === 1) renderFrame(0);
      }};
      frames.push(img);
    }}

    function renderFrame(idx) {{
      const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(idx)));
      const img = frames[frameIdx];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cW = canvas.width, cH = canvas.height;
      const iW = img.naturalWidth, iH = img.naturalHeight;
      const scale = Math.max(cW / iW, cH / iH);
      const sW = iW * scale, sH = iH * scale;
      const oX = (cW - sW) / 2, oY = (cH - sH) / 2;

      ctx.drawImage(img, oX, oY, sW, sH);

      const pct = (frameIdx / (TOTAL_FRAMES - 1)) * 100;
      if (progressFill) progressFill.style.width = pct + '%';
      if (frameLabel) frameLabel.innerText = String(frameIdx + 1).padStart(3, '0') + ' / ' + TOTAL_FRAMES;
    }}

    // Mouse & Touch Scrubbing
    container.addEventListener('mousedown', (e) => {{
      isDragging = true;
      dragStartX = e.clientX;
      dragStartFrame = targetFrame;
      lastActiveTime = performance.now();
      isIdle = false;
      if (modeLabel) modeLabel.innerText = 'MODE: ACTIVE DRAG SCRUB';
    }});

    window.addEventListener('mouseup', () => {{ isDragging = false; }});
    window.addEventListener('mousemove', (e) => {{
      lastActiveTime = performance.now();
      if (isDragging) {{
        const deltaX = e.clientX - dragStartX;
        const frameOffset = (deltaX / window.innerWidth) * TOTAL_FRAMES * 1.5;
        targetFrame = (dragStartFrame + frameOffset + TOTAL_FRAMES * 10) % TOTAL_FRAMES;
        isIdle = false;
      }}
    }});

    // Scroll scrubbing
    window.addEventListener('scroll', () => {{
      lastActiveTime = performance.now();
      isIdle = false;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      targetFrame = scrollPct * (TOTAL_FRAMES - 1);
      if (modeLabel) modeLabel.innerText = 'MODE: SCROLL SCRUB';
    }}, {{ passive: true }});

    // Main RAF Loop
    function loop(time) {{
      frameCount++;
      if (time - lastFpsTime >= 500) {{
        fps = Math.round((frameCount * 1000) / (time - lastFpsTime));
        frameCount = 0;
        lastFpsTime = time;
        if (telemetryPill) {{
          telemetryPill.innerText = fps + ' FPS • FRAME ' + String(Math.round(currentFrame) + 1).padStart(3, '0') + '/' + TOTAL_FRAMES + ' • DUAL-MODE';
        }}
      }}

      if (time - lastActiveTime > 1500) {{
        if (!isIdle) {{
          isIdle = true;
          if (modeLabel) modeLabel.innerText = 'MODE: AMBIENT CINEMATIC';
        }}
        targetFrame = (targetFrame + 0.35) % TOTAL_FRAMES;
      }}

      // Shortest angular lerp wrapping
      let diff = targetFrame - currentFrame;
      while (diff < -TOTAL_FRAMES / 2) diff += TOTAL_FRAMES;
      while (diff > TOTAL_FRAMES / 2) diff -= TOTAL_FRAMES;
      currentFrame = (currentFrame + diff * 0.08 + TOTAL_FRAMES) % TOTAL_FRAMES;

      renderFrame(currentFrame);
      requestAnimationFrame(loop);
    }}
    requestAnimationFrame(loop);
  }})();
  </script>
</body>
</html>"#,
        title = config.title,
        subtitle = config.subtitle,
        frame_count = frame_count
    );

    let mut file = File::create(&html_path).map_err(|e| format!("Failed to create HTML: {}", e))?;
    file.write_all(html_content.as_bytes()).map_err(|e| format!("Failed to write HTML: {}", e))?;

    println!("  >> Turnkey Scrollytelling HTML Synthesized: {:?}", html_path);
    Ok(())
}

fn main() {
    print_banner();
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        println!(r#"USAGE:
  aeterna_video_canvas_synth <input_video.mp4> [output_directory] [target_frames] [width] [height] [quality]

EXAMPLES:
  aeterna_video_canvas_synth hero_sculpture_loop.mp4 ./scrolly_output 120 1280 720 80
  aeterna_video_canvas_synth gemini_generated_video_ab0a7bbd.mp4 ./aura_canvas 120 1280 720 85
"#);
        return;
    }

    let input_path = PathBuf::from(&args[1]);
    if !input_path.exists() {
        eprintln!("[ERROR]: Input video does not exist: {:?}", input_path);
        std::process::exit(1);
    }

    let mut config = VideoCanvasConfig::default();
    config.input_path = input_path.clone();

    if args.len() >= 3 {
        config.output_dir = PathBuf::from(&args[2]);
    }
    if args.len() >= 4 {
        if let Ok(f) = args[3].parse::<usize>() { config.target_frames = f; }
    }
    if args.len() >= 5 {
        if let Ok(w) = args[4].parse::<u32>() { config.target_width = w; }
    }
    if args.len() >= 6 {
        if let Ok(h) = args[5].parse::<u32>() { config.target_height = h; }
    }
    if args.len() >= 7 {
        if let Ok(q) = args[6].parse::<u32>() { config.quality = q; }
    }

    let video_stem = input_path.file_stem().and_then(|s| s.to_str()).unwrap_or("AETERNA_SCULPTURE");
    config.title = format!("APEX 3D // {}", video_stem.to_uppercase());

    let t_start = Instant::now();
    match extract_webp_frames(&config) {
        Ok((count, total_bytes)) => {
            if let Err(e) = generate_scrollytelling_template(&config, count) {
                eprintln!("[ERROR]: Failed to generate scrollytelling template: {}", e);
                std::process::exit(1);
            }
            let total_dur = t_start.elapsed();
            println!("\n[SYNTH COMPLETE]: Generated {} WebP frames ({:.2} MB) in {:?}", count, total_bytes as f64 / 1_048_576.0, total_dur);
            println!("[DEPLOY READY]: Open file:///{:?} in any browser.\n", config.output_dir.join("index.html").canonicalize().unwrap_or(config.output_dir.join("index.html")));
        }
        Err(e) => {
            eprintln!("[ERROR]: Frame extraction failed: {}", e);
            std::process::exit(1);
        }
    }
}
