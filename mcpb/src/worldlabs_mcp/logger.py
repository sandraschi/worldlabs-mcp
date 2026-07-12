import asyncio
import logging
import os
import traceback as _traceback
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Create a queue for SSE log streaming
log_queue: asyncio.Queue = asyncio.Queue()
_log_clients: list[asyncio.Queue] = []
_logger = logging.getLogger(__name__)


class SSEHandler(logging.Handler):
    """Logging handler that pushes log records into SSE client queues."""

    def emit(self, record: logging.LogRecord) -> None:
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": self.format(record),
            "logger": record.name,
            "source": "backend",
        }
        if record.exc_info and record.exc_info != (None, None, None):
            log_entry["traceback"] = "".join(_traceback.format_exception(*record.exc_info))
        for client in _log_clients:
            try:
                asyncio.run_coroutine_threadsafe(client.put(log_entry), asyncio.get_event_loop())
            except Exception:
                _logger.debug("Log SSE client put failed (loop closed or queue full)", exc_info=True)


def setup_logger(name: str = "worldlabs-mcp", level: int = logging.DEBUG) -> logging.Logger:
    """Sets up the global logger with rotating file and SSE handlers."""
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Prevent duplicate handlers if called multiple times
    if logger.handlers:
        return logger

    # Ensure logs directory exists
    log_dir = os.path.join(os.getcwd(), "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "bridge.log")

    # Format
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # File Handler (5MB per file, keep 5)
    file_handler = RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # SSE Handler
    sse_handler = SSEHandler()
    sse_handler.setFormatter(formatter)
    logger.addHandler(sse_handler)

    # Console Handler (Optional, for redundancy)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger


def get_logger(name: str = "worldlabs-mcp") -> logging.Logger:
    return logging.getLogger(name)


# Initialize the global instance
logger = setup_logger()
