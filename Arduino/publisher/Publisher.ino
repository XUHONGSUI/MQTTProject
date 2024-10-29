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
const char topicled[] = "digitalcontrol/send";
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
  // put your setup code here, to run once:
  pinMode(ledPin0, OUTPUT);
  pinMode(ledPin1, OUTPUT);
  pinMode(syncPin, OUTPUT);
 
 for(int i=3; i<14; i++){
    pinMode(i, INPUT); 
 }

  connectWiFi();
  setupMQTT();
  Info(address,topicInfo,interval);
  delay(100);
  mqttClient.subscribe("pins/#");
  mqttClient.subscribe("pins/value");
  mqttClient.subscribe("test/#");

   mqttClient.onMessage(onMqttMessage);
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

  unsigned long currentMillis = millis();

    digitalWrite(syncPin, HIGH);  
    digitalWrite(ledPin0,HIGH);
    digitalWrite(ledPin1,LOW);
    delay(10);
    pinRead();
    delay(400);

    //mqttClient.beginMessage(topicled);
    digitalWrite(ledPin0,LOW);
    digitalWrite(ledPin1,LOW);
    delay(10);
    pinRead();
    delay(400);

    analogRead();
    delay(400);
    digitalWrite(syncPin, LOW);  
  // }

}

void onMqttMessage(int messageSize) {
 String message;
  while (mqttClient.available()) {
    char c = (char)mqttClient.read();
     message += (char)mqttClient.read();
  }
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
    for (int i = 0; i <= 14; i++) {
      int digitalValue = digitalRead(i);
      char key[3];
      snprintf(key, sizeof(key), "D%d", i);
      digitalvalue[key]["value"] = digitalValue;
    }



    char JsonInfo[512];
    serializeJson(pinsinformation, JsonInfo);
    mqttClient.beginMessage("pins/value");
    mqttClient.print(JsonInfo);
    mqttClient.endMessage();
}

void analogRead(){
    StaticJsonDocument<512> Analoginformation;
    JsonObject analogvalue = Analoginformation.createNestedObject("AnalogPins");
    JsonObject clientID = Analoginformation.createNestedObject("clientID");
    Analoginformation["clientID"] = address;

    for (int i = 0; i <= 7; i++) {
      int analogValue = analogRead(i);
      char key[3];
      snprintf(key, sizeof(key), "A%d", i);
      analogvalue[key]["value"] = analogValue;
    }

    char JsonInfo[512];
    serializeJson(Analoginformation,JsonInfo);
    mqttClient.beginMessage("pins/value/analog");
    mqttClient.print(JsonInfo);
    mqttClient.endMessage();
}
