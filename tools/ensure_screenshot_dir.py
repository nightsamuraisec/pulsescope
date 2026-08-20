# Ensure local screenshot/ media directory exists (run before serve).
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHOT = ROOT / "screenshot"
SHOT.mkdir(parents=True, exist_ok=True)
print(f"[PulseScope] ready: {SHOT}")
