<?php

declare(strict_types=1);

const OAUTH_CONFIG_FILE = __DIR__ . '/../cms-config.php';
const STATE_COOKIE = 'cms_oauth_state';
const DEFAULT_SCOPE = 'repo,user';
const ALLOWED_SCOPES = ['repo', 'public_repo', 'user', 'read:user', 'user:email'];

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function oauthConfig(): ?array
{
    if (!is_file(OAUTH_CONFIG_FILE)) return null;
    $config = require OAUTH_CONFIG_FILE;
    $id = is_array($config) ? ($config['github_client_id'] ?? '') : '';
    $secret = is_array($config) ? ($config['github_client_secret'] ?? '') : '';
    if (!is_string($id) || !is_string($secret) || $id === '' || $secret === '') return null;
    return ['id' => $id, 'secret' => $secret];
}

function requestedScope(string $requested): string
{
    $scopes = array_values(array_filter(preg_split('/[\s,]+/', $requested) ?: []));
    if ($scopes === []) return DEFAULT_SCOPE;
    foreach ($scopes as $scope) {
        if (!in_array($scope, ALLOWED_SCOPES, true)) return DEFAULT_SCOPE;
    }
    return implode(',', $scopes);
}

function callbackUrl(): string
{
    return 'https://' . $_SERVER['HTTP_HOST'] . '/cms-auth/callback.php';
}

function setStateCookie(string $value, int $lifetime): void
{
    setcookie(STATE_COOKIE, $value, [
        'expires' => time() + $lifetime,
        'path' => '/cms-auth/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function exchangeCode(array $config, string $code): array
{
    $body = json_encode([
        'client_id' => $config['id'],
        'client_secret' => $config['secret'],
        'code' => $code,
        'redirect_uri' => callbackUrl(),
    ]);

    $curl = curl_init('https://github.com/login/oauth/access_token');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    $response = curl_exec($curl);
    curl_close($curl);

    $data = is_string($response) ? json_decode($response, true) : null;
    return is_array($data) ? $data : [];
}

function finish(?string $token = null, string $error = '', string $code = ''): never
{
    $state = $token !== null ? 'success' : 'error';
    $content = $token !== null
        ? ['provider' => 'github', 'token' => $token]
        : ['provider' => 'github', 'error' => $error, 'errorCode' => $code];
    $message = json_encode('authorization:github:' . $state . ':' . json_encode($content, JSON_UNESCAPED_UNICODE), JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
    $hasToken = $token !== null ? 'true' : 'false';

    setStateCookie('', -3600);
    header('Content-Type: text/html; charset=utf-8');
    echo <<<HTML
    <!doctype html>
    <html lang="pl"><body><script>
    (() => {
      window.addEventListener('message', ({ data, origin }) => {
        if (data !== 'authorizing:github') return;
        if ({$hasToken} && origin !== window.location.origin) return;
        window.opener?.postMessage({$message}, origin);
      });
      window.opener?.postMessage('authorizing:github', '*');
    })();
    </script></body></html>
    HTML;
    exit;
}
