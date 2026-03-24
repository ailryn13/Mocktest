# Simple HTTP server to serve JAR file for download
# Run this on Windows, then download from VM

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JAR File HTTP Server" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$port = 8888
$directory = Get-Location

Write-Host "Starting HTTP server on port $port..." -ForegroundColor Yellow
Write-Host "Serving from: $directory`n" -ForegroundColor Gray

Write-Host "On your VM, run this command:" -ForegroundColor Green
Write-Host "  cd ~/backend" -ForegroundColor White
Write-Host "  wget http://YOUR_WINDOWS_IP:8888/exam-portal-backend-1.0.0.jar" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop the server after download completes.`n" -ForegroundColor Yellow

# Start Python HTTP server (if available)
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $port
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 -m http.server $port
} else {
    Write-Host "ERROR: Python not found. Installing simple .NET server..." -ForegroundColor Red
    
    # Fallback: .NET HttpListener
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://+:$port/")
    $listener.Start()
    Write-Host "Server started at http://localhost:$port/" -ForegroundColor Green
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        Write-Host "Request: $($request.Url.LocalPath)" -ForegroundColor Cyan
        
        if ($request.Url.LocalPath -eq "/exam-portal-backend-1.0.0.jar") {
            $filePath = Join-Path $directory "exam-portal-backend-1.0.0.jar"
            if (Test-Path $filePath) {
                $buffer = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $buffer.Length
                $response.ContentType = "application/java-archive"
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                Write-Host "  -> Sent JAR file ($($buffer.Length) bytes)" -ForegroundColor Green
            }
        }
        
        $response.Close()
    }
}
