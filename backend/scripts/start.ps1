Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\Jal_Rakshak\backend; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000'

Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\Jal_Rakshak\frontend; npm run dev'