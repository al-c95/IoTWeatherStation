#include <Wire.h>
#include <SparkFunESP8266WiFi.h>
#include <SoftwareSerial.h>

#define SHT30_ADDR 0x44 // I2C address for SHT30 sensor

const char mySSID[] = "VX220-131E";
const char myPSK[] = "3242674C9A592";
const char server[] = "192.168.1.101";
const char port[] = "8000";

void setup() 
{
  Serial.begin(9600);

  initialise_ESP8266();

  connect_ESP8266();
  display_connection_info();

  // initialise I2C
  delay(1000);
  Wire.begin();
  delay(1000);
}

void loop()
{
  // send measurement command
  Wire.beginTransmission(SHT30_ADDR);
  Wire.write(0x2C); // MSB
  Wire.write(0x06); // LSB
  Wire.endTransmission();

  delay(20);

  // request 6 bytes from SHT30:
  // - Temperature MSB
  // - Temperature LSB
  // - CRC
  // - Humidity MSB
  // - Humidity LSB
  // - CRC
  Wire.requestFrom(SHT30_ADDR, 6);

  if (Wire.available()==6)
  {
    uint16_t raw_temperature = Wire.read() << 8 | Wire.read();
    Wire.read(); // skip CRC
    uint16_t raw_humidity = Wire.read() << 8 | Wire.read();
    Wire.read(); // skip CRC

    delay(50);

    // convert raw values to physical values
    float temperature = -45.0 + 175.0 * ((float)raw_temperature / 65535.0);
    temperature = round(temperature * 10.0) / 10.0;
    float humidity_float = 100.0 * ((float)raw_humidity / 65535.0);
    humidity_float = round(humidity_float);
    int humidity = (int)humidity_float;

    send_sensor_data(temperature, humidity);
  }
  else
  {
    Serial.println("Failed to read data from SHT30.");
  }

  // wait for 3 s
  delay(3000);
}

void initialise_ESP8266()
{
  int test = esp8266.begin();
  if (test != true)
  {
    Serial.println(F("Error communicating with ESP8266."));
    error_loop(test);
  }
  Serial.println(F("ESP8266 present."));
}

void connect_ESP8266()
{
  // use Station mode
  int retVal = esp8266.getMode();
  if (retVal != ESP8266_MODE_STA)
  {
    retVal = esp8266.setMode(ESP8266_MODE_STA);
    if (retVal < 0)
    {
      Serial.println(F("Error setting mode."));
      error_loop(retVal);
    }
  }
  Serial.println(F("Mode set to station"));

    // esp8266.status() indicates the ESP8266's WiFi connect
  // status.
  // A return value of 1 indicates the device is already
  // connected. 0 indicates disconnected. (Negative values
  // equate to communication errors.)
  retVal = esp8266.status();
  if (retVal <= 0)
  {
    Serial.print(F("Connecting to "));
    Serial.println(mySSID);
    // esp8266.connect([ssid], [psk]) connects the ESP8266
    // to a network.
    // On success the connect function returns a value >0
    // On fail, the function will either return:
    //  -1: TIMEOUT - The library has a set 30s timeout
    //  -3: FAIL - Couldn't connect to network.
    retVal = esp8266.connect(mySSID, myPSK);
    if (retVal < 0)
    {
      Serial.println(F("Error connecting"));
      error_loop(retVal);
    }
  }
}

void display_connection_info()
{
  char connectedSSID[24];
  memset(connectedSSID, 0, 24);
  // esp8266.getAP() can be used to check which AP the
  // ESP8266 is connected to. It returns an error code.
  // The connected AP is returned by reference as a parameter.
  int retVal = esp8266.getAP(connectedSSID);
  if (retVal > 0)
  {
    Serial.print(F("Connected to: "));
    Serial.println(connectedSSID);
  }

  // esp8266.localIP returns an IPAddress variable with the
  // ESP8266's current local IP address.
  IPAddress myIP = esp8266.localIP();
  Serial.print(F("My IP: ")); Serial.println(myIP);
}

void send_sensor_data(float temperature, int humidity)
{
  ESP8266Client client;

  // ESP8266Client connect([server], [port]) is used to 
  // connect to a server (const char * or IPAddress) on
  // a specified port.
  // Returns: 1 on success, 2 on already connected,
  // negative on fail (-1=TIMEOUT, -3=FAIL).
  int retVal = client.connect(server, 8000);
  if (retVal <= 0)
  {
    Serial.println(F("Failed to connect to server."));
    return;
  }

  String json_data = "{\"temperature\":" + String(temperature, 1) + ",\"humidity\":" + String(humidity) + "}";
  String httpRequest = 
    "POST /update-sensor-data HTTP/1.1\r\n" +
    String("Host: ") + server + ":" + port + "\r\n" +
    "Content-Type: application/json\r\n"
    "Content-Length: " + String(json_data.length()) + "\r\n"
    "Connection: close\r\n"
    "\r\n" + 
    json_data;

  client.print(httpRequest);
  Serial.println("HTTP POST request sent:");
  Serial.println(json_data);

  // available() will return the number of characters
  // currently in the receive buffer.
  while (client.available())
    Serial.write(client.read()); // read() gets the FIFO char
  
  // connected() is a boolean return value - 1 if the 
  // connection is active, 0 if it's closed.
  if (client.connected())
    client.stop(); // stop() closes a TCP connection.
}

void error_loop(int error)
{
  Serial.print(F("Error: ")); Serial.println(error);
  Serial.println(F("Looping forever."));
  for (;;)
    ;
}