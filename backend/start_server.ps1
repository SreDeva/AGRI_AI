# PowerShell script to start the FastAPI development server

Write-Host "Starting AGRI AI Backend Server..." -ForegroundColor Green

# Check if virtual environment exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
    Write-Host "Installing requirements..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Please update .env file with your Twilio credentials and MongoDB connection string." -ForegroundColor Red
    Write-Host "Press any key to continue after updating .env file..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Start the server
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
