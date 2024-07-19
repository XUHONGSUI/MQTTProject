class Arduino{
    constructor(){  
        this.pins={};      
    }

    pinMode(pin,mode){
        this.pins[pin]=mode;
    }

    digitalWrite(pin,value){
        this.pins[pin]=value;
    }

    digitalRead(pin){
        return this.pins[pin];
    }

    analogWrite(pin,value){
        this.pins[pin]=value;
    }

    analogRead(pin){
        return this.pins[pin];
    }
}