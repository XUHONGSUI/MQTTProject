#include <ArduinoMqttClient.h>
#include <WiFiNINA.h>
#include "arduino_secrets.h"
#include <utility/wifi_drv.h>
#include <ArduinoJson.h>
///////please enter your sensitive data in the Secret tab/arduino_secrets.h
char ssid[] = SECRET_SSID;        // your network SSID
char pass[] = SECRET_PASS;    // your network password
char token[] = MQTT_TOKEN;    //token

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

const char broker[] = "10.42.0.1";
int        port     = 1883;
char       charMac[18];
const int led1 = 0; // D0
const int led2 = 1; // D1
String address="";
unsigned long interval=1000;
//subscribe 
const char topic[]    = "home/ledcontrol";
//publish 
const char topicInfo[] ="state/information";

void setup() {
  WiFiDrv::pinMode(25, OUTPUT); //define green pin
  WiFiDrv::pinMode(26, OUTPUT); //define red pin
  WiFiDrv::pinMode(27, OUTPUT); //define blue pin
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  Serial.begin(9600);
  connectWiFi();
  setupMQTT();
  // set the message receive callback
  mqttClient.onMessage(onMqttMessage);
  mqttClient.subscribe(topic);
  mqttClient.subscribe("home/temperature");
  //publish 
  Info(address,topicInfo,interval);

}

void loop() {
    //reconnect to wifi in case automatically disconnect
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnect, reconnecting...");
    connectWiFi();
  }
  //reconnect to MQTTserver
  if (!mqttClient.connected()) {
    Serial.println("MQTT disconnect, reconnecting...");
    setupMQTT();
  }

  mqttClient.poll();
}

void onMqttMessage(int messageSize) {

  String subtopic = mqttClient.messageTopic();
  String content;
  // use the Stream interface to print the contents
  while (mqttClient.available()) {
    char c= (char)mqttClient.read(); 
    content =content+(String)c;
  }
  if(subtopic=="home/ledcontrol"){
   if(content=="start"){
    digitalWrite(led1, HIGH);
    digitalWrite(led2, LOW);
   }else if(content=="stop"){
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
   }
  }

}

void connectWiFi() {
  Serial.print("Connecting to Wi-Fi...");
  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    Serial.print(".");
    delay(5000);
  }
  Serial.println("Connected to Wi-Fi.");
  byte mac[6];
  WiFi.macAddress(mac);
  sprintf(charMac, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  address = (String)charMac;
}

void setupMQTT() {
  mqttClient.setId(charMac);
  mqttClient.setUsernamePassword(address, token);
  mqttClient.setKeepAliveInterval(interval);

  Serial.print("Connecting to MQTT broker...");
  while (!mqttClient.connect(broker, port)) {
    Serial.print("MQTT connection failed! Error code = ");
    Serial.println(mqttClient.connectError());
    delay(5000);
  }

  Serial.println("Connected to MQTT broker.");
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