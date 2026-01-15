#include <SoftwareSerial.h>
#include <SparkFunESP8266WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 3

const char mySSID[] = "VX220-131E";
const char myPSK[] = "3242674C9A592";
const char server[] = "192.168.1.100";

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup()
{
  Serial.begin(9600);
  serialTrigger(F("Press any key to begin."));

  initialiseESP8266();

  connectESP8266();
  displayConnectionInfo();

  sensors.begin();
}

void loop()
{
  sensors.requestTemperatures();
  float temperature = sensors.getTempCByIndex(0);

  sendSensorData(temperature, 0);

  delay(3000);
}

void initialiseESP8266()
{
  int test = esp8266.begin();
  if (test != true)
  {
    Serial.println(F("Error communicating with ESP8266."));
    errorLoop(test);
  }
  Serial.println(F("ESP8266 present."));
}

void connectESP8266()
{
  // use Station mode
  int retVal = esp8266.getMode();
  if (retVal != ESP8266_MODE_STA)
  {
    retVal = esp8266.setMode(ESP8266_MODE_STA);
    if (retVal < 0)
    {
      Serial.println(F("Error setting mode."));
      errorLoop(retVal);
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
      errorLoop(retVal);
    }
  }
}

void displayConnectionInfo()
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

void sendSensorData(float temperature, int humidity)
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

  String jsonData = "{\"temperature\":" + String(temperature, 1) + ",\"humidity\":" + String(humidity) + "}";
  String httpRequest = 
    "POST /update-sensor-data HTTP/1.1\r\n"
    "Host: 192.168.1.100:8000\r\n"
    "Content-Type: application/json\r\n"
    "Content-Length: " + String(jsonData.length()) + "\r\n"
    "Connection: close\r\n"
    "\r\n" + 
    jsonData;

  client.print(httpRequest);
  Serial.println("HTTP POST request sent:");
  Serial.println(jsonData);

  // available() will return the number of characters
  // currently in the receive buffer.
  while (client.available())
    Serial.write(client.read()); // read() gets the FIFO char
  
  // connected() is a boolean return value - 1 if the 
  // connection is active, 0 if it's closed.
  if (client.connected())
    client.stop(); // stop() closes a TCP connection.
}

void errorLoop(int error)
{
  Serial.print(F("Error: ")); Serial.println(error);
  Serial.println(F("Looping forever."));
  for (;;)
    ;
}

void serialTrigger(String message)
{
  Serial.println();
  Serial.println(message);
  Serial.println();
  while (!Serial.available())
    ;
  while (Serial.available())
    Serial.read();
}