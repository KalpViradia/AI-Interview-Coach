import sys
import asyncio
import uvicorn

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_render = os.environ.get("RENDER") is not None

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
    else:
        # Disable reload in production (like Render) to avoid spawning duplicate processes and wasting memory
        uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not is_render)
