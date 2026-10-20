<?php

declare(strict_types=1);

const CONFIG_FILE = __DIR__ . '/contact-config.php';
const RATE_LIMIT = 5;
const RATE_WINDOW = 600;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $ok): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok]);
    exit;
}

function field(string $key): string
{
    $raw = $_POST[$key] ?? '';
    return is_string($raw) ? trim($raw) : '';
}

function length(string $value): int
{
    return mb_strlen($value, 'UTF-8');
}

function singleLine(string $value): string
{
    return preg_replace('/[\r\n\t]+/u', ' ', $value) ?? '';
}

function isPhoneLength(string $raw): bool
{
    $digits = preg_replace('/\D/', '', $raw) ?? '';
    $count = strlen($digits);
    if (str_starts_with($raw, '+')) return $count >= 8 && $count <= 15;
    if (str_starts_with($digits, '00')) return $count >= 10 && $count <= 17;
    if (str_starts_with($digits, '48') && $count === 11) return true;
    return $count === 9;
}

function isRateLimited(): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = sys_get_temp_dir() . '/contact-' . hash('sha256', $ip . __FILE__);
    $now = time();
    $hits = [];

    if (is_file($file)) {
        $stored = json_decode((string) file_get_contents($file), true);
        if (is_array($stored)) {
            $hits = array_values(array_filter($stored, fn($time) => is_int($time) && $now - $time < RATE_WINDOW));
        }
    }

    if (count($hits) >= RATE_LIMIT) return true;

    $hits[] = $now;
    file_put_contents($file, json_encode($hits), LOCK_EX);
    return false;
}

function webhookUrl(): string
{
    if (!is_file(CONFIG_FILE)) return '';
    $config = require CONFIG_FILE;
    $url = is_array($config) ? ($config['teams_webhook_url'] ?? '') : '';
    return is_string($url) && str_starts_with($url, 'https://') ? $url : '';
}

function postJson(string $url, string $json): bool
{
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $result = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        return $result !== false && $status >= 200 && $status < 300;
    }

    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $json,
        'timeout' => 15,
        'ignore_errors' => true,
    ]]);
    $result = @file_get_contents($url, false, $context);
    $statusLine = $http_response_header[0] ?? '';
    return $result !== false && preg_match('#^HTTP/\S+\s+2\d\d#', $statusLine) === 1;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(405, false);

if (field('website') !== '') respond(200, true);

$name = singleLine(field('name'));
$phone = singleLine(field('phone'));
$email = mb_strtolower(singleLine(field('email')), 'UTF-8');
$businessForm = singleLine(field('businessForm'));
$scope = singleLine(field('scope'));
$message = field('message');
$source = field('source') === 'drawer' ? 'panel boczny' : 'strona Kontakt';

$valid =
    length($name) >= 2 && length($name) <= 120 && preg_match("/^\p{L}[\p{L}\s.'-]*$/u", $name) === 1 &&
    length($phone) <= 40 && preg_match('/^\+?[\d\s()-]+$/', $phone) === 1 && isPhoneLength($phone) &&
    length($email) <= 160 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false &&
    $businessForm !== '' && length($businessForm) <= 120 &&
    length($scope) <= 300 &&
    length($message) <= 2000;

if (!$valid) respond(422, false);

if (isRateLimited()) respond(429, false);

$webhook = webhookUrl();
if ($webhook === '') respond(500, false);

$dash = '—';
$sentAt = (new DateTimeImmutable('now', new DateTimeZone('Europe/Warsaw')))->format('d.m.Y, H:i');

$card = [
    '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
    'type' => 'AdaptiveCard',
    'version' => '1.4',
    'body' => [
        ['type' => 'TextBlock', 'size' => 'Medium', 'weight' => 'Bolder', 'text' => 'Nowe zgłoszenie ze strony'],
        ['type' => 'TextBlock', 'isSubtle' => true, 'spacing' => 'None', 'text' => $sentAt . ' | formularz: ' . $source],
        ['type' => 'FactSet', 'facts' => [
            ['title' => 'Imię i nazwisko', 'value' => $name],
            ['title' => 'Telefon', 'value' => $phone],
            ['title' => 'E-mail', 'value' => $email],
            ['title' => 'Forma działalności', 'value' => $businessForm],
            ['title' => 'Czego potrzebuje', 'value' => $scope !== '' ? $scope : $dash],
        ]],
        ['type' => 'TextBlock', 'weight' => 'Bolder', 'text' => 'Wiadomość'],
        ['type' => 'TextBlock', 'wrap' => true, 'spacing' => 'Small', 'text' => $message !== '' ? $message : $dash],
    ],
];

$payload = json_encode([
    'type' => 'message',
    'attachments' => [[
        'contentType' => 'application/vnd.microsoft.card.adaptive',
        'contentUrl' => null,
        'content' => $card,
    ]],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$sent = $payload !== false && postJson($webhook, $payload);

respond($sent ? 200 : 502, $sent);
