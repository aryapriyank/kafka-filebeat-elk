import os
import time
from datetime import datetime
import random
from pathlib import Path
import logging
from logging.handlers import TimedRotatingFileHandler
from faker import Faker

# Initialize Faker
faker = Faker()

# Ensure logs directory exists
LOGS_DIR = Path(__file__).parent / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Configure logger
def setup_logger():
    logger = logging.getLogger('microservice')
    logger.setLevel(logging.DEBUG)
    
    # Create formatter
    formatter = logging.Formatter(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "%(service)s", "message": "%(message)s"}'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Rotating file handler
    service_name = os.getenv('SERVICE_NAME', 'service')
    current_time = datetime.now().strftime('%Y-%m-%d-%H')
    base_filename = LOGS_DIR / f"{service_name}-{current_time}.log"
    file_handler = TimedRotatingFileHandler(
        filename=base_filename,
        when='H',  # Rotate every hour
        interval=1,
        backupCount=5,  # Keep 5 backup files
        encoding='utf-8'
    )
    # Custom namer function to maintain the date format in rotated files
    def namer(default_name):
        # Extract the base name without extension
        base = os.path.basename(default_name)
        if base.endswith(".log"):
            # Remove .log from the end
            base = base[:-4]
        # Get the current hour's timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d-%H')
        # Construct the new name
        return str(LOGS_DIR / f"{service_name}-{timestamp}.log")
    
    file_handler.namer = namer
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger

class LogGenerator:
    def __init__(self):
        self.service_names = (
            [os.getenv('SERVICE_NAME')] if os.getenv('SERVICE_NAME') else [
                "web-service",
                "auth-service",
                "user-service",
                "order-service",
                "inventory-service",
                "payment-service",
            ]
        )
        self._stopped = False
        self.logger = setup_logger()

    def generate_log(self):
        """Generate a single log entry"""
        service = random.choice(self.service_names)
        level = random.choice(['info', 'warning', 'error', 'debug'])
        message = faker.catch_phrase()
        
        # Get the logging method corresponding to the level
        log_method = getattr(self.logger, level)
        
        # Add extra={'service': service} to include service in the log record
        log_method(message, extra={'service': service})

    def start(self, interval_ms=1000):
        """Start generating logs periodically"""
        interval_sec = interval_ms / 1000
        self._stopped = False
        
        try:
            while not self._stopped:
                self.generate_log()
                time.sleep(interval_sec)
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        """Stop generating logs"""
        self._stopped = True

def main():
    log_generator = LogGenerator()
    try:
        log_generator.start()
    except KeyboardInterrupt:
        log_generator.stop()

if __name__ == "__main__":
    main()