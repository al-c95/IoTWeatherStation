#include <IRremote.h>

IRrecv irrecv(2);

decode_results results;

void setup(){

  Serial.begin(9600);

  irrecv.enableIRIn();

  irrecv.blink13(true);

}

void loop(){

  if (irrecv.decode(&results)){

        Serial.print(results.value, DEC);

        Serial.print("   ");

        Serial.println(results.value, HEX);

        irrecv.resume();

  }

  delay(100);

}