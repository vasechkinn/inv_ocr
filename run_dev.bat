@echo off

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
    ) else (
        echo .env.example not found
        exit /b 1
    )
)

powershell -Command "(Get-Content .env) -replace '^DB_TYPE=.*', 'DB_TYPE=sqlite' | Set-Content .env"

echo DEBUG: debug version started, database selected: sqlite

if not exist ".venv" (
    uv venv
)

uv sync

uv run fastapi dev
