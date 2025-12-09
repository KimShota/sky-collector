// ===============================
// Arduino Code for ADXL335 + Button + LEDs
// ===============================
// ADXL335 X-axis on A0
const int buttonPin = 2;

// LEDs
const int led1 = 8;   // choose any digital pin
const int led2 = 9;

// LED timing variables
unsigned long ledOnTime = 0;  // When LED was turned on
const unsigned long ledDuration = 500;  // LED stays on for 500ms

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT);    // physical pull-down
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
}

void loop() {
  // -----------------------------
  // 1. SEND SENSOR VALUES
  // -----------------------------
  int x = analogRead(A0);
  int btn = digitalRead(buttonPin);
  Serial.print("ACC:");
  Serial.print(x);
  Serial.print(",BTN:");
  Serial.println(btn);

  // -----------------------------
  // 2. LISTEN FOR COMMANDS FROM P5.JS
  // -----------------------------
  if (Serial.available()) {
    char c = Serial.read();
    if (c == '1') {
      // Star collected - turn on LEDs
      digitalWrite(led1, HIGH);
      digitalWrite(led2, HIGH);
      ledOnTime = millis();  // Record when LEDs were turned on
    }
    if (c == '0') {
      // Turn off LEDs immediately
      digitalWrite(led1, LOW);
      digitalWrite(led2, LOW);
      ledOnTime = 0;  // Reset timer
    }
  }

  // -----------------------------
  // 3. AUTO TURN OFF LEDs AFTER DURATION
  // -----------------------------
  if (ledOnTime > 0 && (millis() - ledOnTime) >= ledDuration) {
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
    ledOnTime = 0;  // Reset timer
  }

  delay(100);  // ~50Hz data rate
}

