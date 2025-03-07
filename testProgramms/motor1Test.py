import time
import RPi.GPIO as GPIO
import threading

# Pin assignments
ENCODER_A_PIN = 14
ENCODER_B_PIN = 15
MOTOR_PWM_PIN = 4
MOTOR_FORWARD_PIN = 27
MOTOR_BACKWARD_PIN = 22

# Motor control parameters
PWM_FREQUENCY = 1000  # 1 kHz
MAX_DUTY_CYCLE = 100  # RPi.GPIO uses 0-100 range
RAMP_TIME = 8        # Ramp-up time in seconds
ENCODER_TICKS_TARGET = 30000  # Target encoder ticks (50 full rotations)

# Encoder tick count
encoder_ticks = 0
last_encoder_state = 0
running = True  # Control flag for encoder thread

# GPIO setup
GPIO.setmode(GPIO.BCM)
GPIO.setup(ENCODER_A_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(ENCODER_B_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(MOTOR_PWM_PIN, GPIO.OUT)
GPIO.setup(MOTOR_FORWARD_PIN, GPIO.OUT)
GPIO.setup(MOTOR_BACKWARD_PIN, GPIO.OUT)

# Set up PWM
pwm = GPIO.PWM(MOTOR_PWM_PIN, PWM_FREQUENCY)
pwm.start(0)  # Start PWM with 0% duty cycle

# Function to read encoder in a fast loop
def encoder_reader():
    global encoder_ticks, last_encoder_state
    while running:
        a = GPIO.input(ENCODER_A_PIN)
        b = GPIO.input(ENCODER_B_PIN)
        state = (a << 1) | b  # Convert to 2-bit number

        # Improved quadrature decoding
        lookup_table = {
            (0b00, 0b01): 1,
            (0b01, 0b11): 1,
            (0b11, 0b10): 1,
            (0b10, 0b00): 1,
            (0b00, 0b10): -1,
            (0b10, 0b11): -1,
            (0b11, 0b01): -1,
            (0b01, 0b00): -1,
        }

        if (last_encoder_state, state) in lookup_table:
            encoder_ticks += lookup_table[(last_encoder_state, state)]

        last_encoder_state = state
        time.sleep(0.0001)  # High-speed polling


# Start encoder reader in a separate thread
encoder_thread = threading.Thread(target=encoder_reader)
encoder_thread.start()

# Function to set motor speed and direction
def set_motor(speed):
    if speed > 0:
        GPIO.output(MOTOR_FORWARD_PIN, GPIO.HIGH)
        GPIO.output(MOTOR_BACKWARD_PIN, GPIO.LOW)
    elif speed < 0:
        GPIO.output(MOTOR_FORWARD_PIN, GPIO.LOW)
        GPIO.output(MOTOR_BACKWARD_PIN, GPIO.HIGH)
    else:
        GPIO.output(MOTOR_FORWARD_PIN, GPIO.LOW)
        GPIO.output(MOTOR_BACKWARD_PIN, GPIO.LOW)

    pwm.ChangeDutyCycle(abs(speed))  # Set PWM duty cycle

# Function to ramp motor speed
def ramp_motor(target_ticks, direction):
    global encoder_ticks
    encoder_ticks = 0
    set_motor(0)
    time.sleep(1)

    step_delay = RAMP_TIME / MAX_DUTY_CYCLE
    for duty_cycle in range(MAX_DUTY_CYCLE + 1):
        set_motor(direction * duty_cycle)
        time.sleep(step_delay)
        print(f"Encoder ticks: {encoder_ticks}")
        if abs(encoder_ticks) >= target_ticks:
            set_motor(0)
            break

    set_motor(0)  # Stop motor instantly

try:
    # Ramp motor forward
    print("Ramping motor forward...")
    ramp_motor(ENCODER_TICKS_TARGET, 1)

    # Short pause
    time.sleep(2)

    # Ramp motor backward
    print("Ramping motor backward...")
    ramp_motor(ENCODER_TICKS_TARGET, -1)
finally:
    # Ensure PWM is stopped cleanly
    pwm.stop()
    set_motor(0)
    running = False
    encoder_thread.join()
    GPIO.cleanup()
    print("Program terminated.")