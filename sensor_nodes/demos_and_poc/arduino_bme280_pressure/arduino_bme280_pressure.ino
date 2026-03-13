#include <Wire.h>

#define BME280_ADDR 0x76 // I2C address for BME280 sensor

void setup()
{
  Serial.begin();

  // initialise I2C
  delay(1000);
  Wire.begin();
  delay(1000);
}

void loop()
{

}