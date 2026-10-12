<?php
/**
 * FixFlow Phone Service Management System — PHP CLI Built-in Server Router
 * =========================================================================
 * No XAMPP / Apache / MySQL required.
 * Allows multi-device POS and workbench access on the same local network (LAN / Wi-Fi).
 *
 * Usage:
 *   php -S 0.0.0.0:8080 router.php
 *
 * Client Devices (Phone, Tablet, Cashier PC) on the same Wi-Fi connect to:
 *   http://<YOUR_LOCAL_IP>:8080   (e.g., http://192.168.2.6:8080)
 */

$backendPort = (int)(getenv('PORT') ?: 3000);
$backendUrl = 'http://127.0.0.1:' . $backendPort;
$distPath = getenv('FIXFLOW_DIST_DIR') ?: (__DIR__ . DIRECTORY_SEPARATOR . 'dist');

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$parsedPath = parse_url($requestUri, PHP_URL_PATH);
$queryString = parse_url($requestUri, PHP_URL_QUERY);

// Ensure CORS headers for local network multi-device access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-user-id, x-username, x-user-role, x-technician-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ----------------------------------------------------
// 1. API FORWARDING TO FIXFLOW BACKEND
// ----------------------------------------------------
if (strpos($parsedPath, '/api/') === 0 || $parsedPath === '/api') {
    $targetUrl = rtrim($backendUrl, '/') . $parsedPath . ($queryString ? '?' . $queryString : '');

    // Gather request headers to forward
    $headersToForward = [];
    foreach ($_SERVER as $key => $value) {
        if (strpos($key, 'HTTP_') === 0) {
            $headerName = str_replace('_', '-', substr($key, 5));
            // Skip Host header to let target resolve correctly
            if (!in_array(strtolower($headerName), ['host', 'connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'expect', 'content-length', 'content-type'])) {
                $headersToForward[] = "$headerName: $value";
            }
        } elseif (strtolower($key) === 'content_type' && !empty($value)) {
            $headerName = str_replace('_', '-', $key);
            $headersToForward[] = "$headerName: $value";
        }
    }

    // HTTP streams must not inherit browser keep-alive; it can stall the single PHP worker.
    $headersToForward[] = 'Connection: close';
    $rawBody = file_get_contents('php://input');

    // Use cURL if available, otherwise fallback to stream context
    if (function_exists('curl_init')) {
        $ch = curl_init($targetUrl);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headersToForward);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        if (!empty($rawBody)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $rawBody);
        }

        $response = curl_exec($ch);

        if ($response === false) {
            $curlErr = curl_error($ch);
            curl_close($ch);
            http_response_code(502);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'ok' => false,
                'error' => "PHP CLI Router: Cannot connect to FixFlow backend on $backendUrl ($curlErr). Ensure Node server is running on port $backendPort.",
                'php_cli' => true,
                'suggestion' => 'Run `npm run start:production` in the project folder.'
            ]);
            exit;
        }

        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        $headerStr = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);

        http_response_code($statusCode);
        $headerLines = explode("\r\n", $headerStr);
        foreach ($headerLines as $line) {
            if (empty($line) || stripos($line, 'HTTP/') === 0) continue;
            if (preg_match('/^(Transfer-Encoding|Connection|Keep-Alive):/i', $line)) continue;
            header($line, false);
        }

        echo $body;
        exit;
    } else {
        // Fallback using stream context
        $opts = [
            'http' => [
                'method' => $_SERVER['REQUEST_METHOD'],
                'header' => implode("\r\n", $headersToForward),
                'content' => $rawBody,
                'ignore_errors' => true,
                'follow_location' => 0,
                'timeout' => 30,
            ]
        ];
        $context = stream_context_create($opts);
        $body = @file_get_contents($targetUrl, false, $context);

        if ($body === false) {
            http_response_code(502);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'ok' => false,
                'error' => "PHP CLI Router: Could not reach FixFlow backend at $backendUrl.",
                'php_cli' => true,
            ]);
            exit;
        }

        // Set response headers from $http_response_header
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $hdr) {
                if (preg_match('#^HTTP/\d\.\d\s+(\d+)#i', $hdr, $m)) {
                    http_response_code((int)$m[1]);
                } elseif (!preg_match('/^(Transfer-Encoding|Connection|Keep-Alive):/i', $hdr)) {
                    header($hdr, false);
                }
            }
        }

        echo $body;
        exit;
    }
}

// ----------------------------------------------------
// 2. STATIC ASSETS SERVING FROM dist/
// ----------------------------------------------------
$filePath = realpath($distPath . $parsedPath);

// Security check: ensure path is inside $distPath
$resolvedDist = realpath($distPath);
if ($filePath && $resolvedDist && strpos($filePath, $resolvedDist . DIRECTORY_SEPARATOR) === 0 && is_file($filePath)) {
    $mimeMap = [
        'html' => 'text/html; charset=UTF-8',
        'css'  => 'text/css; charset=UTF-8',
        'js'   => 'application/javascript; charset=UTF-8',
        'mjs'  => 'application/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'webp' => 'image/webp',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'eot'  => 'application/vnd.ms-fontobject',
        'txt'  => 'text/plain; charset=UTF-8',
    ];

    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mime = $mimeMap[$ext] ?? 'application/octet-stream';

    header("Content-Type: $mime");
    header('Cache-Control: public, max-age=3600');
    readfile($filePath);
    exit;
}

// ----------------------------------------------------
// 3. SPA FALLBACK TO dist/index.html
// ----------------------------------------------------
$indexPath = $distPath . DIRECTORY_SEPARATOR . 'index.html';
if (file_exists($indexPath)) {
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile($indexPath);
    exit;
}

// If dist/index.html is not built yet
http_response_code(503);
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FixFlow POS — Production Build Required</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
        .box { max-width: 540px; margin: 60px auto; background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; }
        code { background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 14px; }
        h1 { color: #38bdf8; font-size: 22px; margin-top: 0; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="box">
        <h1>FixFlow POS Multi-Device Hub</h1>
        <p>The client bundle has not been generated yet. Please run the build command once:</p>
        <p><code>npm run build</code></p>
        <p>Once built, this PHP CLI router will serve all connected phones, tablets, and POS terminals on your local network.</p>
    </div>
</body>
</html>
