#include <Arduino.h>
#include <Wire.h>
#include <VL53L1X.h>
#include <ArduinoJson.h>
#include "vl53l1x-st-api/vl53l1_api.h"

int sensorState = 0;
int sensTime = 50;
int distMode = VL53L1_DISTANCEMODE_SHORT;

VL53L1_Dev_t                   dev;
VL53L1_DEV                     Dev = &dev;
int status;

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ;
  }

}

void loop() {

  StaticJsonBuffer<250> jsonBuffer;

  JsonObject& root = jsonBuffer.createObject();


  if (Serial.available() > 0) {
    TWCR = 0; // reset TwoWire Control Register to default, inactive state

    // read the incoming byte:
    String incomingByte1 = Serial.readStringUntil(':');
    String incomingByte2 = Serial.readStringUntil(':');

    sensTime = incomingByte2.toInt();
    if(incomingByte1.charAt(0) == 'S'){
      distMode = VL53L1_DISTANCEMODE_SHORT;
    }
    if(incomingByte1.charAt(0)  == 'M'){
      distMode = VL53L1_DISTANCEMODE_MEDIUM;
    }
    if(incomingByte1.charAt(0)  == 'L'){
      distMode = VL53L1_DISTANCEMODE_LONG;
    }
    sensorState = 0;
  }

  if(sensorState == 0){
    Wire.begin();
    Wire.setClock(400000);
    Serial.begin(115200);

    Dev->I2cDevAddr = 0x52;

    VL53L1_software_reset(Dev);
    status = VL53L1_WaitDeviceBooted(Dev);
    status = VL53L1_DataInit(Dev);
    status = VL53L1_StaticInit(Dev);
    status = VL53L1_SetDistanceMode(Dev, distMode);
    status = VL53L1_SetMeasurementTimingBudgetMicroSeconds(Dev, 50000);
    status = VL53L1_SetInterMeasurementPeriodMilliSeconds(Dev, 50); // reduced to 50 ms from 500 ms in ST example
    status = VL53L1_StartMeasurement(Dev);
    if(status)
    {
      while(1);
    }
  }


  static VL53L1_RangingMeasurementData_t RangingData;

  status = VL53L1_WaitMeasurementDataReady(Dev);
  if(!status)
  {
    status = VL53L1_GetRangingMeasurementData(Dev, &RangingData);
    if(status==0)
    {
      uint8_t byteData;
      uint16_t wordData;

      root["s"] = VL53L1X::rangeStatusToString((VL53L1X::RangeStatus) RangingData.RangeStatus);

      root["r"] = RangingData.RangeMilliMeter;

      root["t"] = sensorState;
      root["m"] = distMode;
      root["b"] = sensTime;
      root["a"] = RangingData.SigmaMilliMeter;
      root["h"] = RangingData.SignalRateRtnMegaCps;
      root["p"] = RangingData.EffectiveSpadRtnCount;
      root["i"] = RangingData.AmbientRateRtnMegaCps;
    }
    status = VL53L1_ClearInterruptAndStartMeasurement(Dev);
    sensorState = 1;
  }
    String var;
    root.printTo(var);
    Serial.println(var);
}