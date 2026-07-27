import time
import subprocess
import requests
import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [WATCHDOG] %(message)s",
    handlers=[
        logging.FileHandler("pipeline_watchdog.log"),
        logging.StreamHandler()
    ]
)

FASTAPI_HEALTH_URL = "http://127.0.0.1:8000/api/health"
NEXTJS_URL = "http://localhost:3000"

def is_process_running(process_name: str) -> bool:
    """Checks if a python/node script process is currently running."""
    try:
        output = subprocess.check_output(["ps", "aux"]).decode("utf-8")
        return any(process_name in line for line in output.splitlines() if "grep" not in line)
    except Exception:
        return False

def check_fastapi_server():
    """Checks if FastAPI backend is healthy; restarts if down."""
    try:
        res = requests.get(FASTAPI_HEALTH_URL, timeout=3)
        if res.status_code == 200:
            return True, res.json().get("total_videos_analyzed", 0)
    except Exception:
        pass
    
    logging.warning("FastAPI Server (port 8000) not responding. Restarting backend server...")
    try:
        subprocess.Popen(
            ["bash", "-c", "pkill -f 'uvicorn server:app' || true && source .venv/bin/activate && uvicorn server:app --host 127.0.0.1 --port 8000"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(3)
    except Exception as e:
        logging.error(f"Failed to restart FastAPI server: {e}")
    return False, 0

def check_batch_runner():
    """Checks if batch_500_runner.py is active; restarts if stopped."""
    if not is_process_running("batch_500_runner.py"):
        logging.warning("batch_500_runner.py is not running. Restarting 500-video background pipeline...")
        try:
            subprocess.Popen(
                [sys.executable, "batch_500_runner.py"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            logging.info("Successfully restarted batch_500_runner.py in background.")
        except Exception as e:
            logging.error(f"Failed to restart batch_500_runner.py: {e}")
    else:
        logging.info("batch_500_runner.py is active & running normally.")

def main_watchdog_loop():
    logging.info("=========================================================")
    logging.info("STARTING SELF-HEALING WATCHDOG FOR ELECTION PIPELINE")
    logging.info("=========================================================")

    while True:
        try:
            fastapi_ok, analyzed_count = check_fastapi_server()
            check_batch_runner()

            if fastapi_ok:
                logging.info(f"STATUS REPORT: {analyzed_count} videos analyzed & loaded in dashboard live!")
            else:
                logging.info("STATUS REPORT: Backend restarting...")

        except Exception as e:
            logging.error(f"Unexpected error in Watchdog loop: {e}")

        # Check every 30 seconds
        time.sleep(30)

if __name__ == "__main__":
    main_watchdog_loop()
