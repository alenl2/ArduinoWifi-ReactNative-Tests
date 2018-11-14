#include <Arduino.h>
#include <Wire.h>
#include <VL53L1X.h>
#include <ArduinoJson.h>

VL53L1X sensor;
int sensorState = 0;
VL53L1X::DistanceMode dm = VL53L1X::Short;
int sensTime = 50;

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    ;
  }

  Wire.begin();
  Wire.setClock(400000); // use 400 kHz I2C

  sensor.setTimeout(500);
  if (!sensor.init())
  {
    sensorState = 1;
  }else{
      sensorState = 2;
  }

}

void loop() {

  if (Serial.available() > 0) {
    TWCR = 0; // reset TwoWire Control Register to default, inactive state

    // read the incoming byte:
    String incomingByte1 = Serial.readStringUntil(':');
    String incomingByte2 = Serial.readStringUntil(':');

    sensTime = incomingByte2.toInt();
    if(incomingByte1.charAt(0) == 'S'){
      dm = VL53L1X::Short;
    }
    if(incomingByte1.charAt(0)  == 'M'){
      dm = VL53L1X::Medium;
    }
    if(incomingByte1.charAt(0)  == 'L'){
      dm = VL53L1X::Long;
    }

    Wire.begin();
    Wire.setClock(400000); // use 400 kHz I2C

    sensor.setTimeout(sensTime*10);
    if (!sensor.init())
    {
      sensorState = 1;
    }else{
        sensorState = 2;
    }

  }

  if(sensorState == 2){
    sensor.setDistanceMode(dm);
    sensor.setMeasurementTimingBudget(sensTime*1000);

    sensor.startContinuous(sensTime);
    sensorState = 3;
  }

  if(sensorState == 3){
    sensor.read();
  }

  DynamicJsonBuffer jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["range"] = sensor.ranging_data.range_mm;
  root["status"] = VL53L1X::rangeStatusToString(sensor.ranging_data.range_status);
  root["peak"] = sensor.ranging_data.peak_signal_count_rate_MCPS;
  root["ambient"] = sensor.ranging_data.ambient_count_rate_MCPS;
  root["sensorState"] =sensorState;
  root["mode"] = (int)dm;
  root["timeBudget"] = sensTime;

    String output;
    root.printTo(output);
    
    Serial.println(output);
}