import logging
import sys

def setup_logger(name: str = "ai_coach") -> logging.Logger:
    """Configure and return a structured logger for the backend application."""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        logger.addHandler(handler)
        
    return logger

logger = setup_logger()

def log_agent_execution(
    session_id: str,
    agent_name: str,
    execution_time: float,
    model: str = "N/A",
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    retries: int = 0,
    success: bool = True,
    final_status: str = "OK"
):
    """Prints a highly structured log for the logging dashboard."""
    status_str = "SUCCESS" if success else "FAILURE"
    
    log_msg = f"""
[Interview Session: {session_id}]
Request Started
↓
Agent Name: {agent_name}
↓
Execution Time: {execution_time:.2f}s
↓
Gemini Model Used: {model}
↓
Prompt Tokens: {prompt_tokens}
↓
Completion Tokens: {completion_tokens}
↓
Retries: {retries}
↓
Success / Failure: {status_str}
↓
Final Status: {final_status}
"""
    if success:
        logger.info(log_msg)
    else:
        logger.error(log_msg)
