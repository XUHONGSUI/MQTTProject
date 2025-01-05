![image](https://github.com/user-attachments/assets/ebce1f68-6ddd-43e8-8669-bd02e47070c9)

A brief software process architecture


The project is an online system for monitoring and viewing the state of microcontroller devices on the web server via the MQTT (Message Queuing Telemetry Transport). 
In the current working equipment, several microcontroller devices are working independently, the usage and online status of these devices are not well-monitored. To improve monitorability, the solution is to use Message Queuing Telemetry Transport protocol to transfer data of state of devices. Additionally, a Web server is included in the project to present data more conveniently and track equipment state.

1.MQTT Client on Arduino
[image](https://github.com/user-attachments/assets/b13616a9-fb58-4863-a8b5-d2e0dd74e7de)

2.The MQTT server on Raspberry Pi 4B
[image](https://github.com/user-attachments/assets/1841e17c-0386-4810-b538-51889f9628cb)

3.Data display on web pages
[image](https://github.com/user-attachments/assets/9fc362aa-cf15-46ec-bc68-55bb45fc4585)

4.Docker realization
[image](https://github.com/user-attachments/assets/e83f01c2-8b24-4e7d-9281-48dbcb99259f)

Docker images link: https://hub.docker.com/u/xuhongsui


