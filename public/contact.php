<?php

declare(strict_types=1);

const RECIPIENT = 'biuro@biuro-mazur.pl';
const SENDER = 'formularz@biuro-mazur.pl';
const SENDER_NAME = 'Formularz biuro-mazur.pl';
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

function encodeHeader(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
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

$dash = '—';
$body = implode("\r\n", [
    'Nowe zgłoszenie z formularza na biuro-mazur.pl',
    '',
    'Imię i nazwisko: ' . $name,
    'Telefon: ' . $phone,
    'E-mail: ' . $email,
    'Forma działalności: ' . $businessForm,
    'Czego potrzebuje: ' . ($scope !== '' ? $scope : $dash),
    '',
    'Wiadomość:',
    $message !== '' ? str_replace(["\r\n", "\r", "\n"], "\r\n", $message) : $dash,
    '',
    '---',
    'Wysłano: ' . (new DateTimeImmutable('now', new DateTimeZone('Europe/Warsaw')))->format('d.m.Y, H:i'),
    'Formularz: ' . $source,
    'Odpowiedz na tę wiadomość, żeby napisać bezpośrednio do klienta.',
]);

$headers = implode("\r\n", [
    'From: ' . encodeHeader(SENDER_NAME) . ' <' . SENDER . '>',
    'Reply-To: ' . encodeHeader($name) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
]);

$sent = mail(
    RECIPIENT,
    encodeHeader('Nowe zgłoszenie: ' . $name),
    chunk_split(base64_encode($body)),
    $headers,
    '-f' . SENDER
);

respond($sent ? 200 : 500, $sent);
