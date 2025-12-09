// pin to read button press 
const int buttonPin = 2;

// LED pints to light up when stars are collected
const int led1 = 8;
const int led2 = 9;

unsigned long ledOnTime = 0;  // record when the LED turns on 
const unsigned long ledDuration = 500;  // LEDs turn on after 500ms

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT); // set to input since we want to send sensor values 
  pinMode(led1, OUTPUT); 
  pinMode(led2, OUTPUT);
  digitalWrite(led1, LOW); // turn off first
  digitalWrite(led2, LOW);
}

void loop() {
  int x = analogRead(A0); // read accelerometer value (0 to 1023)
  int btn = digitalRead(buttonPin); // read the button state 
  Serial.print("ACC:"); 
  Serial.print(x); // print accelerometer value
  Serial.print(",BTN:");
  Serial.println(btn); // print the button state (1 if is's pressed)

  if (Serial.available()) {
    char c = Serial.read(); // gets one character from p5
    if (c == '1') { // if it is 1
      // turn on the LED pins
      digitalWrite(led1, HIGH);
      digitalWrite(led2, HIGH);
      // save the time so that LEDs can turn off automatically after 500 ms
      ledOnTime = millis();
    }
    if (c == '0') { // if it is 0
      // turn off the LEDs 
      digitalWrite(led1, LOW);
      digitalWrite(led2, LOW);
      // reset the timer to 0
      ledOnTime = 0;
    }
  }

  // if the LED has been lighting up for more than 500 ms
  if (ledOnTime > 0 && (millis() - ledOnTime) >= ledDuration) {
    // turn both off
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
    ledOnTime = 0;
  }

  // set delay to 100 so that plane on p5 won't be too sensitive 
  delay(100);
}

