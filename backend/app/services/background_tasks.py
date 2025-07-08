import asyncio
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class TaskManager:
    def __init__(self):
        self.tasks = {}
        self.running = False
    
    async def start(self):
        """Start the task manager"""
        self.running = True
        logger.info("Task manager started")
    
    async def stop(self):
        """Stop the task manager"""
        self.running = False
        # Cancel all running tasks
        for task in self.tasks.values():
            if not task.done():
                task.cancel()
        logger.info("Task manager stopped")
    
    async def add_task(self, task_id: str, coro, *args, **kwargs):
        """Add a task to the manager"""
        if task_id in self.tasks:
            logger.warning(f"Task {task_id} already exists")
            return
        
        task = asyncio.create_task(coro(*args, **kwargs))
        self.tasks[task_id] = task
        
        # Clean up completed tasks
        task.add_done_callback(lambda t: self.tasks.pop(task_id, None))
        
        logger.info(f"Task {task_id} added")
        return task
    
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get task status"""
        if task_id not in self.tasks:
            return {"status": "not_found"}
        
        task = self.tasks[task_id]
        if task.done():
            if task.exception():
                return {"status": "failed", "error": str(task.exception())}
            else:
                return {"status": "completed", "result": task.result()}
        else:
            return {"status": "running"}
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a task"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        if not task.done():
            task.cancel()
            logger.info(f"Task {task_id} cancelled")
            return True
        
        return False