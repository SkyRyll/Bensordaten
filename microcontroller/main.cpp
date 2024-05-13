#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_BMP085.h> 
#include <ArduinoJson.h>
#include "DHT.h"


const char* ssid = "iTelefon von Mir";
const char* password = "niki2821g"; 
//const char* ssid = "piwifi-a005";
//const char* password = "piuserwifi"; 

#define DHTPIN  02
#define DHTTYPE DHT11

const char* mqtt_client = "ESP1337Niki2821";      
const char* broker = "broker.hivemq.com"; 

const char* mqtt_username = "artemis"; //MQTT broker username
const char* mqtt_password = "artemis"; //MQTT broker password

WiFiClient espClient; 	
PubSubClient client(broker, 1883, espClient);


DHT dht(DHTPIN,DHTTYPE);
float temp = 0;
float humidity = 0;

Adafruit_BMP085 bmp180;

void wifiConnect() {
  WiFi.begin(ssid, password);
  Serial.println("Wait for connection");
  while( WiFi.status() != WL_CONNECTED ){
    delay(500); Serial.print(".");
  }
  Serial.println();  Serial.print("Connected to ");  Serial.println(ssid);
  Serial.print("IP address: ");  Serial.println(WiFi.localIP());
}



void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}
				

void connectMQTT() {
//  if (client.connect(mqtt_client)) {
//      Serial.println("connected");
//      //client.publish("outTopic", "hello world");
//      //client.subscribe("HAHA");
//    } else {
//      Serial.print("failed, rc=");
//      Serial.print(client.state());
//      Serial.println(" try again ");
//      delay(100);
//      connectMQTT();
//    }

    while (!client.connected()) 
  {
    
    if(client.connect(mqtt_client))
    {
      Serial.println("Broker connected");
    }
    else
    {
      Serial.print(".");
      //Serial.println(client.state());
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(9600);
  wifiConnect();
  dht.begin();
  bmp180.begin();
  //client.connect(mqtt_client, "artemis", "artemis");
  connectMQTT();
  
  client.setCallback(callback);
}



void sendToMQTT() {
  StaticJsonDocument<200> message;
  float temp = dht.readTemperature();
  float humd = dht.readHumidity();
  float alt = bmp180.readAltitude();
  float press = bmp180.readSealevelPressure();
  
  round(temp);
  round(humd);
  round(alt);
  round(press);

  message["temperature"] = temp;
  message["humidity"] = humd;   
  message["altitude"] = alt; 
  message["pressure"] = press; 
  char messageBuffer[512];
  serializeJson(message, messageBuffer);

  client.publish("EST/EFI222/NSNS", messageBuffer);

  Serial.println("ESP32 - sent to MQTT:");
  Serial.print("payload:");
  Serial.println(messageBuffer);
}

void loop() {
  if ( WiFi.status() != WL_CONNECTED ) wifiConnect();
  delay(59900); 
  //Serial.println("test");
  //client.publish("outTopic", "hello world");
  client.loop();

  temp = dht.readTemperature();            
  humidity = dht.readHumidity(); 

  float alt = bmp180.readAltitude();
  delay(100); 
  //char messageBuffer[25];
  //sprintf(messageBuffer,"%4.1f°C", temp);
  //client.publish("outTopic", messageBuffer);
  
  Serial.println(temp);
  Serial.println(humidity);
  Serial.println(alt);

  Serial.println(client.state());

  if(!client.connected()){
    client.connect(mqtt_client);
    Serial.println("reconnected to broker");
  }

  sendToMQTT();
  }



