"""
AETERNA 3D ASSET & HYPER3D PIPELINE WATCHDOG
Sovereign Automation Engine for Instant 3D Model Ingestion & GitHub Pages Auto-Deploy
"""

import os
import sys
import time
import shutil
import zipfile
import subprocess
import requests
from pathlib import Path

DOWNLOADS_DIR = Path(r"C:\Users\papic\Downloads")
PROJECT_DIR = Path(r"C:\Users\papic\Desktop\aeterna-3dwebsite-projects")
ASSETS_DIR = PROJECT_DIR / "assets"
TARGET_GLB = ASSETS_DIR / "sculpture.glb"

HYPER3D_TASK_UUID = "ba453bee-4011-4936-b505-796b73e6f09d"

def log(msg):
    print(f"[AETERNA-3D-PIPELINE] {msg}", flush=True)

def push_to_github(commit_msg):
    log("Committing and pushing to GitHub Pages...")
    try:
        subprocess.run(["git", "add", "-A"], cwd=PROJECT_DIR, check=True)
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=PROJECT_DIR, check=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=PROJECT_DIR, check=True)
        log("SUCCESS: Pushed to GitHub Pages!")
    except Exception as e:
        log(f"Git push error: {e}")

def process_file(file_path: Path):
    ext = file_path.suffix.lower()
    log(f"Detected asset: {file_path.name}")

    if ext == ".glb":
        shutil.copy2(file_path, TARGET_GLB)
        log(f"Copied GLB to {TARGET_GLB}")
        push_to_github(f"feat: update sovereign 3D model ({file_path.name})")
        return True

    elif ext == ".zip":
        extract_dir = PROJECT_DIR / "temp_extract"
        extract_dir.mkdir(exist_ok=True)
        try:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            # Find glb
            glb_files = list(extract_dir.rglob("*.glb"))
            if glb_files:
                shutil.copy2(glb_files[0], TARGET_GLB)
                log(f"Extracted and installed GLB: {glb_files[0].name}")
                push_to_github(f"feat: integrate Hyper3D model from zip ({file_path.name})")
                return True
        finally:
            if extract_dir.exists():
                shutil.rmtree(extract_dir, ignore_errors=True)

    elif ext == ".obj":
        target_obj = ASSETS_DIR / "sculpture.obj"
        shutil.copy2(file_path, target_obj)
        log(f"Copied OBJ to {target_obj}")
        push_to_github(f"feat: update sovereign OBJ mesh ({file_path.name})")
        return True

    return False

def check_rodin_api(api_key):
    if not api_key:
        return False
    log(f"Checking Hyper3D Rodin API for task {HYPER3D_TASK_UUID}...")
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        url = f"https://api.hyper3d.com/api/v2/requests/status/{HYPER3D_TASK_UUID}"
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            status = data.get("status")
            log(f"Rodin Task Status: {status}")
            if status == "completed":
                download_url = data.get("output", {}).get("media_url") or data.get("outputs", [{}])[0].get("url")
                if download_url:
                    log(f"Downloading completed GLB from {download_url}...")
                    glb_r = requests.get(download_url, timeout=30)
                    if glb_r.status_code == 200:
                        with open(TARGET_GLB, "wb") as f:
                            f.write(glb_r.content)
                        log("Downloaded sculpture.glb directly via API!")
                        push_to_github("feat: download and integrate Hyper3D Rodin GLB via API")
                        return True
    except Exception as e:
        log(f"API query failed: {e}")
    return False

def watch_downloads():
    log("AETERNA 3D Pipeline Watchdog ACTIVE.")
    log(f"Monitoring: {DOWNLOADS_DIR} for .glb, .zip, .obj...")
    seen_files = set(f.name for f in DOWNLOADS_DIR.iterdir() if f.is_file())

    # Check existing downloads first
    for f in DOWNLOADS_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in [".glb", ".obj", ".zip"] and ("rodin" in f.name.lower() or "hyper" in f.name.lower() or "sculpture" in f.name.lower()):
            log(f"Found existing relevant asset: {f.name}")
            if process_file(f):
                return

    while True:
        try:
            current_files = set(f.name for f in DOWNLOADS_DIR.iterdir() if f.is_file())
            new_files = current_files - seen_files
            for filename in new_files:
                file_path = DOWNLOADS_DIR / filename
                if file_path.suffix.lower() in [".glb", ".obj", ".zip"]:
                    log(f"New download detected: {filename}")
                    time.sleep(1) # wait for download to finish writing
                    process_file(file_path)
            seen_files = current_files
            time.sleep(2)
        except KeyboardInterrupt:
            break
        except Exception as e:
            time.sleep(2)

if __name__ == "__main__":
    api_key = os.environ.get("RODIN_API_KEY")
    if api_key and check_rodin_api(api_key):
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == "--watch":
        watch_downloads()
    else:
        # Check single pass
        for f in DOWNLOADS_DIR.iterdir():
            if f.is_file() and f.suffix.lower() in [".glb", ".obj", ".zip"] and ("rodin" in f.name.lower() or "hyper" in f.name.lower() or "sculpture" in f.name.lower()):
                process_file(f)
                break
        log("Single pass complete. Run with --watch to keep resident.")
