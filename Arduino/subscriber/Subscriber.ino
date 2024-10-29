#include <ArduinoMqttClient.h>
#include <WiFiNINA.h>
#include "arduino_secrets.h"
#include <utility/wifi_drv.h>
#include <ArduinoJson.h>

char ssid[] = SECRET_SSID;  // your network SSID
char pass[] = SECRET_PASS;  // your network password
char token[] = MQTT_TOKEN;  //token


WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);


const char broker[] = "10.42.0.1";
int port = 1883;
char charMac[18];
const long interval = 1000;
unsigned long previousMillis = 0;
String topicsall = "";
String allcontent = "";
const char topicled[] = "home/digitalcontrol";
int topicnum = 0;
String address = "";
int i = 0;
const int ledPin0 = 0;  // D0 Pin
const int ledPin1 = 1;  //D1 Pin
const int syncPin = 2;  //D2 Synchronize
volatile boolean ledrunning = false;
unsigned long lastReconnectAttempt = 0;
unsigned long intervalTime = 1000;
const char topicInfo[] = "state/info";


void setup() {
  pinMode(ledPin0, INPUT);
  pinMode(ledPin1, INPUT);
  pinMode(syncPin, INPUT);
  connectWiFi();
  setupMQTT();
  Info(address,topicInfo,interval);
}

void loop() {
  
  mqttClient.poll();
  if (WiFi.status() != WL_CONNECTED) {
    //Serial.println("Wi-Fi disconnect, reconnecting...");
    connectWiFi();
  }
  //reconnect to MQTTserver
  if (!mqttClient.connected()) {
    //Serial.println("MQTT disconnect, reconnecting...");
    setupMQTT();
  }

  if (digitalRead(syncPin) == HIGH) {
    delay(10);
    pinRead();
    delay(400);
  }

}

void onMqttMessage(int messageSize) {

  while (mqttClient.available()) {
    char c = (char)mqttClient.read();
    topicsall = topicsall + (String)c;
  }
  topicsall = "";
}

void connectWiFi() {
  //Serial.print("Connecting to Wi-Fi...");
  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    //Serial.print(".");
    delay(5000);
  }
  //Serial.println("Connected to Wi-Fi.");
  byte mac[6];
  WiFi.macAddress(mac);
  sprintf(charMac, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  address = (String)charMac;
}

void setupMQTT() {
  mqttClient.setId(charMac);
  mqttClient.setUsernamePassword(address, token);
  mqttClient.setKeepAliveInterval(interval);

  //Serial.print("Connecting to MQTT broker...");
  while (!mqttClient.connect(broker, port)) {
    //Serial.print("MQTT connection failed! Error code = ");
   // Serial.println(mqttClient.connectError());
    delay(5000);
  }
   //mqttClient.subscribe("home/digitalcontrol");
  //Serial.println("Connected to MQTT broker.");
}

void Info(String address,const char* topic,unsigned long interval){
  StaticJsonDocument<200> info;

  info["address"]=address;
  info["topic"]  =topic;
  info["keepalivetime"] =interval;

  char JsonInfo[512];
  serializeJson(info, JsonInfo);

  mqttClient.beginMessage(topicInfo);
  mqttClient.print(JsonInfo);
  mqttClient.endMessage();

}

void pinRead(){
    StaticJsonDocument<512> pinsinformation;
    JsonObject digitalvalue = pinsinformation.createNestedObject("digitalPins");
    JsonObject clientID = pinsinformation.createNestedObject("clientID");
    pinsinformation["clientID"] = address;
    for (int i = 0; i <= 0; i++) {
      int digitalValue = digitalRead(i);
      char key[3];
      snprintf(key, sizeof(key), "D%d", i);
      digitalvalue[key]["value"] = digitalValue;
      String value = String(digitalValue);
    }


    char JsonInfo[512];
    serializeJson(pinsinformation, JsonInfo);

    mqttClient.beginMessage("pins/value");
    mqttClient.print(JsonInfo);
    mqttClient.endMessage();
}