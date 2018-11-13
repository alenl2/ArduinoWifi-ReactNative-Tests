#include <Arduino.h>
#include <Wire.h>
#include <VL53L1X.h>
#include <ArduinoJson.h>

VL53L1X sensor;
int sensorState = 0;
VL53L1X::DistanceMode dm = VL53L1X::Short;

void setup() {
  Serial.begin(115200);

  while (!Serial) {
    ;
  }

  Wire.begin();
  Wire.setClock(400000); // use 400 kHz I2C

  sensor.setTimeout(10000);
  if (!sensor.init())
  {
    sensorState = 1;
    Serial.println("Failed to detect and initialize sensor!");
  }else{
      sensorState = 2;
      Serial.println("Sensor inited");
  }
}

void loop() {

  if(sensorState == 2){
    sensor.setDistanceMode(dm);
    sensor.setMeasurementTimingBudget(70*1000);

    sensor.startContinuous(70);
    sensorState = 3;
    Serial.println("Sensor started");
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

    String output;
    root.printTo(output);
    
    Serial.println(output);
}