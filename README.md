![image](https://github.com/user-attachments/assets/ebce1f68-6ddd-43e8-8669-bd02e47070c9)

A brief software process architecture


The project is an online system for monitoring and viewing the state of microcontroller devices on the web server via the MQTT (Message Queuing Telemetry Transport). 
In the current working equipment, several microcontroller devices are working independently, the usage and online status of these devices are not well-monitored. To improve monitorability, the solution is to use Message Queuing Telemetry Transport protocol to transfer data of state of devices. Additionally, a Web server is included in the project to present data more conveniently and track equipment state.

1.MQTT Client on Arduino
In this project, the main hardware carrier for the MQTT client is the Arduino MKR WiFi 1010. The values of the analog and the digital I/Os(Inputs/Outputs) from the Arduino pins are all these values that would collected by software realization. The Arduino is powered by a USB port.

![image](https://github.com/user-attachments/assets/b13616a9-fb58-4863-a8b5-d2e0dd74e7de)

2.The MQTT server on Raspberry Pi 4B
The MQTT server is the key part of the whole project, without the MQTT server, MQTT clients can’t run independently. The Raspberry Pi 4B is a low-cost, small-size, easy-carry, low-power consumption, open source, and single-board computer. Because of its multiple advantages, the Raspberry Pi is widely used in education and industry, especially in IoT (The Internet of Things) projects.

![image](https://github.com/user-attachments/assets/1841e17c-0386-4810-b538-51889f9628cb)

3.Data display on web pages
Data display is an important part of this project. It is building several HTML (HyperText Markup Language) files to display data on web pages. The first web page is the index.html which is the home page of the web application. After entering the URL http://localhost:3000/ of the web server in the browser, the index.html can be displayed.

![image](https://github.com/user-attachments/assets/9fc362aa-cf15-46ec-bc68-55bb45fc4585)

4.Docker realization
When running the MQTT server and the web server in the Raspberry Pi, each server has specific dependencies and project files. To make deployment and running easier, use Docker to package and deploy to the MQTT server and the web server applications. Because Docker is a widely used Containerization technology, Through Docker, packages the MQTT server project and the web server project into images. Then create the required containers in Docker, running the MQTT server container and web server container in Docker. 
![image](https://github.com/user-attachments/assets/e83f01c2-8b24-4e7d-9281-48dbcb99259f)

Docker images link: https://hub.docker.com/u/xuhongsui


