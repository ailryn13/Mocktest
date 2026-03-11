$url = "http://localhost:9090/actuator/health"
$req = [System.Net.HttpWebRequest]::Create($url)
try {
    $resp = $req.GetResponse()
} catch {
    $resp = $_.Exception.Response
}
if ($resp) {
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $body = $reader.ReadToEnd()
    $body | Out-File -FilePath "C:\Users\ganes\OneDrive\Desktop\Mocktest-main\backend\health_body.json"
    $resp.Close()
}
