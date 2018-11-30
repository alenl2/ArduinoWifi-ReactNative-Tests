#include <Arduino.h>
#include <Wire.h>
#include "vl53l1x-st-api/vl53l1_api.h"

int sensorState = 0;
int sensmode = VL53L1_DISTANCEMODE_SHORT;
int sensttime = 200;


VL53L1_Dev_t                   dev;
VL53L1_DEV                     Dev = &dev;
int status;

void setup() {
  Serial.begin(115200);
}

void loop() {

  if(sensorState == 0){
    Wire.begin();
    Wire.setClock(400000);

    Dev->I2cDevAddr = 0x52;

    VL53L1_software_reset(Dev);
    status = VL53L1_WaitDeviceBooted(Dev);
    status = VL53L1_DataInit(Dev);
    status = VL53L1_StaticInit(Dev);
    status = VL53L1_SetDistanceMode(Dev, sensmode);
    status = VL53L1_SetMeasurementTimingBudgetMicroSeconds(Dev, sensttime*1000);
    status = VL53L1_SetInterMeasurementPeriodMilliSeconds(Dev, sensttime); // reduced to 50 ms from 500 ms in ST example
    status = VL53L1_StartMeasurement(Dev);
    if(status)
    {
      Serial.print("[");
      Serial.print(sensorState);
      Serial.print(",");
      Serial.print(status);
      Serial.println("]");
      delay(100);
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
      Serial.print("[");
      Serial.print(sensorState);
      Serial.print(",");
      Serial.print(status);
      Serial.print(",");
      Serial.print(RangingData.RangeStatus);
      Serial.print(",");
      Serial.print(RangingData.RangeMilliMeter);
      Serial.print(",");
      Serial.print(sensmode);
      Serial.print(",");
      Serial.print(sensttime);
      Serial.print(",");
      Serial.print(RangingData.SigmaMilliMeter);
      Serial.print(",");
      Serial.print(RangingData.AmbientRateRtnMegaCps);
      Serial.print(",");
      Serial.print(RangingData.SignalRateRtnMegaCps);
      Serial.print(",");
      Serial.print(RangingData.EffectiveSpadRtnCount);
      Serial.println("]");
      Serial.flush();
    }else{
      Serial.print("[");
      Serial.print(sensorState);
      Serial.print(",");
      Serial.print(status);
      Serial.println("]");
    }
    status = VL53L1_ClearInterruptAndStartMeasurement(Dev);
    sensorState = 1;
  }else{
    Serial.print("[");
    Serial.print(sensorState);
    Serial.print(",");
    Serial.print(status);
    Serial.println("]");
  }



}