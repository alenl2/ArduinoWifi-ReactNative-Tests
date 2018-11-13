#include <Arduino.h>

#define WEBSOCKETS_TCP_TIMEOUT    (10)

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WiFiClient.h>
#include <WebSocketsServer.h>
#include <Hash.h>
#include <Wire.h>
#include <VL53L1X.h>
#include <ArduinoJson.h>

ESP8266WiFiMulti WiFiMulti;

#define WEBSOCKETS_TCP_TIMEOUT    (10)
WebSocketsServer webSocket = WebSocketsServer(81);
VL53L1X sensor;
int sensorState = 0;

IPAddress local_IP(192,168,1,2);
IPAddress gateway(192,168,1,1);
IPAddress subnet(255,255,255,0);

VL53L1X::DistanceMode dm = VL53L1X::Long;

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {

    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            break;
        case WStype_CONNECTED:
            {
              IPAddress ip = webSocket.remoteIP(num);
              char temp[100];
              sprintf(temp,"[%u] Connected from %d.%d.%d.%d url: %s", num, ip[0], ip[1], ip[2], ip[3], payload);
              Serial.println(temp);
            }
            break;
        case WStype_TEXT:
            Serial.println(length);
            if(length == 0){
                dm = VL53L1X::Short;
            }
            if(length == 1){
                dm = VL53L1X::Medium;
            }
             if(length == 2){
                dm = VL53L1X::Long;
            }
            sensorState = 2;
            break;
        case WStype_BIN:
           char temp2[100];
            sprintf(temp2,"[%u] get binary length: %u\n", num, length);
            Serial.println(temp2);
            hexdump(payload, length);
            break;
    }
}

void setup() {
    Serial.begin(115200);
    Serial.setDebugOutput(true);

/*
    WiFiMulti.addAP("meh", "meh");
    while(WiFiMulti.run() != WL_CONNECTED) {
        Serial.printf("Connecting");
        delay(100);
    }
*/
    WiFi.mode(WIFI_AP_STA);
    WiFi.printDiag(Serial);
    Serial.print("Setting soft-AP configuration ... ");
    Serial.println(WiFi.softAPConfig(local_IP, gateway, subnet) ? "Ready" : "Failed!");

    Serial.print("Setting soft-AP ... ");
    Serial.println(WiFi.softAP("ESPsoftAP_01","thereisnospoon") ? "Ready" : "Failed!");

    Serial.print("Soft-AP IP address = ");
    Serial.println(WiFi.softAPIP());

    WiFi.printDiag(Serial);
    for(uint8_t t = 4; t > 0; t--) {
        Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
        Serial.flush();
        delay(1000);
    }

    webSocket.begin();
    webSocket.onEvent(webSocketEvent);

    Wire.begin(4, 0);
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
    webSocket.loop();
    
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
    
    Serial.print(output);
    Serial.println();

    webSocket.broadcastTXT(output);
}
