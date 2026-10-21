<?php

declare(strict_types=1);

require __DIR__ . '/oauth.php';

if (($_GET['provider'] ?? '') !== 'github') {
    finish(error: 'Panel obsługuje tylko logowanie przez GitHub.', code: 'UNSUPPORTED_BACKEND');
}

$config = oauthConfig();
if ($config === null) {
    finish(error: 'Logowanie przez GitHub nie jest jeszcze skonfigurowane na serwerze.', code: 'MISCONFIGURED_CLIENT');
}

$state = bin2hex(random_bytes(16));
setStateCookie($state, 600);

$query = http_build_query([
    'client_id' => $config['id'],
    'redirect_uri' => callbackUrl(),
    'scope' => requestedScope(is_string($_GET['scope'] ?? null) ? $_GET['scope'] : ''),
    'state' => $state,
]);

header('Location: https://github.com/login/oauth/authorize?' . $query, true, 302);
