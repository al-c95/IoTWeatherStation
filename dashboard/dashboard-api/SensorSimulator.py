import time
import requests
import random
from datetime import datetime


TEMP_AND_HUMIDITY_URL = "http://192.168.1.101:8000/update-sensor-data"
WIND_URL = "http://192.168.1.101:8000/update-wind-data"


def generate_fake_temperature_and_humidity_data():
    """Generate random temperature (-3.4 to 47.9) and humidity (0 to 100)."""
    temperature = round(random.uniform(-3.4, 47.9), 1)
    humidity = round(random.uniform(0, 100), 1)
    
    return {
        "temperature": temperature,
        "humidity": humidity
    }


def generate_fake_wind_data():
    wind_speed = random.randint(1,50)
    wind_direction = random.randint(1,360)

    return {
        "speed": wind_speed,
        "direction": wind_direction
    }



def main():

    while True:
        temp_and_humidity_data = generate_fake_temperature_and_humidity_data()
        wind_data = generate_fake_wind_data()
        try:
            temp_and_humidity_response = requests.post(TEMP_AND_HUMIDITY_URL, json=temp_and_humidity_data)
            print(f"[{datetime.now()}] Sent: {temp_and_humidity_data} | Status: {temp_and_humidity_response.status_code}")

            #wind_response = requests.post(WIND_URL, json=wind_data)
            #print(f"[{datetime.now()}] Sent: {wind_data} | Status: {wind_response.status_code}")
        except Exception as e:
            print(f'Error sending data: {e}')

        time.sleep(3)


if __name__ == "__main__":
    main()