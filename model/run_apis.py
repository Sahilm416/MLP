import subprocess
import sys
import time
from threading import Thread

def run_api(command, port):
    subprocess.run(command, shell=True)

def run_ngrok(port):
    subprocess.run(f'ngrok http {port}', shell=True)

if __name__ == "__main__":
    # Start the APIs in separate threads
    api_commands = [
        ("python main.py", 8000),
        ("python scraper.py", 8001),
        ("python combined_api.py", 8002)
    ]
    
    # Start each API in a separate thread
    api_threads = []
    for cmd, port in api_commands:
        thread = Thread(target=run_api, args=(cmd, port))
        thread.daemon = True
        thread.start()
        api_threads.append(thread)
        print(f"Started API on port {port}")
        time.sleep(2)  # Wait for API to start
    
    # Only expose the combined API through ngrok
    print(f"Starting ngrok tunnel for combined API on port 8002")
    ngrok_thread = Thread(target=run_ngrok, args=(8002,))
    ngrok_thread.daemon = True
    ngrok_thread.start()
    
    try:
        # Keep the main thread running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0) 