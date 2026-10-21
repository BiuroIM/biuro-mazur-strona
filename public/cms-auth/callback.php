<?php

declare(strict_types=1);

require __DIR__ . '/oauth.php';

$code = is_string($_GET['code'] ?? null) ? $_GET['code'] : '';
$state = is_string($_GET['state'] ?? null) ? $_GET['state'] : '';
$expected = is_string($_COOKIE[STATE_COOKIE] ?? null) ? $_COOKIE[STATE_COOKIE] : '';

if ($code === '' || $state === '') {
    finish(error: 'GitHub nie przekazał kodu logowania. Spróbuj ponownie.', code: 'AUTH_CODE_REQUEST_FAILED');
}

if ($expected === '' || !hash_equals($expected, $state)) {
    finish(error: 'Sesja logowania wygasła albo jest nieprawidłowa. Spróbuj ponownie.', code: 'CSRF_DETECTED');
}

$config = oauthConfig();
if ($config === null) {
    finish(error: 'Logowanie przez GitHub nie jest jeszcze skonfigurowane na serwerze.', code: 'MISCONFIGURED_CLIENT');
}

$result = exchangeCode($config, $code);
$token = $result['access_token'] ?? null;

if (!is_string($token) || $token === '') {
    finish(error: 'GitHub nie wydał dostępu. Spróbuj ponownie za chwilę.', code: 'TOKEN_REQUEST_FAILED');
}

finish(token: $token);
