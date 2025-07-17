import time
import requests
import random
from datetime import datetime


API_URL = "http://localhost:8000/update-sensor-data"


def generate_fake_sensor_data():
    """Generate random temperature (-3.4 to 47.9) and humidity (0 to 100)."""
    temperature = round(random.uniform(-3.4, 47.9), 1)
    humidity = round(random.uniform(0, 100), 1)
    return {
        "temperature": temperature,
        "humidity": humidity
    }


def main():
    temperature = 27.0
    while True:
        #data = generate_fake_sensor_data()
        try:
            data = {
                "temperature": temperature,
                "humidity": 50
            }
            response = requests.post(API_URL, json=data)
            print(f"[{datetime.now()}] Sent: {data} | Status: {response.status_code}")
        except Exception as e:
            print(f'Error sending data: {e}')
        
        temperature += 0.1
        time.sleep(3)


if __name__ == "__main__":
    main()