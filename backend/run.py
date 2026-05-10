import asyncio
import selectors
import sys

import uvicorn


def _run() -> None:
    config = uvicorn.Config("app.main:app", host="0.0.0.0", port=8080, log_level="info")
    server = uvicorn.Server(config)

    if sys.platform == "win32":
        # psycopg async does not support ProactorEventLoop on Windows.
        asyncio.run(
            server.serve(),
            loop_factory=lambda: asyncio.SelectorEventLoop(selectors.SelectSelector()),
        )
    else:
        asyncio.run(server.serve())


if __name__ == "__main__":
    _run()

