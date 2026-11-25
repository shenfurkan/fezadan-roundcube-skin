<?php
// Read-only Roundcube presentation hook. Never render HTML, fetch remote URLs,
// mark messages read, or persist body previews in a browser/session/DB cache.
final class FezadanInbox
{
    public function __construct(private rcmail $rc) {}

    public function messages(array $args): array
    {
        if (!$this->rc->user->ID || $this->rc->config->get('skin') !== 'fezadan'
            || !$this->rc->config->get('fezadan_mail_snippets', true)) {
            return $args;
        }
        $storage = $this->rc->get_storage();
        $folder = $storage->get_folder();
        $started = microtime(true);
        $count = 0;
        try {
            foreach (($args['messages'] ?? []) as $key => $header) {
                // Limit optional work on large pages and stop starting new IMAP
                // reads after the budget. A failed preview never breaks listing.
                if (++$count > 30 || microtime(true) - $started > 1.5) {
                    break;
                }
                if (!($header instanceof rcube_message_header) || empty($header->uid)
                    || !preg_match('~^(?:text/(?:plain|html)|multipart/(?:mixed|alternative|related))$~i', (string) $header->ctype)) {
                    continue; // No attachments, encrypted messages or reports.
                }
                try {
                    $storage->set_folder($header->folder ?: $folder);
                    // Reject malformed multipart structures before get_message():
                    // core can otherwise fall back to fetching the entire source.
                    $structure = $storage->conn->getStructure($storage->get_folder(), $header->uid, true);
                    if (!is_array($structure) || !$structure
                        || (str_starts_with(strtolower((string) $header->ctype), 'multipart/') && !is_array($structure[0]))) {
                        continue;
                    }
                    $message = $storage->get_message($header->uid);
                    $part = $message && $message->structure ? self::textPart($message->structure) : null;
                    if (!$part) {
                        continue;
                    }
                    // Native storage uses BODY.PEEK and charset/transfer decoding.
                    // Only the beginning of one text part, never a whole body.
                    $body = $storage->get_message_part($header->uid, $part->mime_id, $part, null, null, false, 4096, false);
                    if (is_string($body)) {
                        // Do not attach message text to a storage/cache-owned header.
                        $displayHeader = clone $header;
                        $displayHeader->list_cols['fezadan_snippet'] = self::text($body, $part->ctype_secondary === 'html');
                        $args['messages'][$key] = $displayHeader;
                    }
                } catch (Throwable $e) {
                    // Snippets are optional; do not log private message contents.
                    break;
                }
            }
        } finally {
            $storage->set_folder($folder);
        }
        return $args;
    }

    public static function textPart(rcube_message_part $part, int $depth = 0): ?rcube_message_part
    {
        if ($depth > 12 || $part->disposition === 'attachment' || !empty($part->filename)
            || in_array($part->ctype_primary, ['application', 'message'], true)
            || $part->ctype_secondary === 'encrypted') {
            return null;
        }
        if ($part->ctype_primary === 'text' && in_array($part->ctype_secondary, ['plain', 'html'], true)) {
            return $part;
        }
        $html = null;
        foreach (array_slice((array) $part->parts, 0, 30) as $child) {
            $candidate = self::textPart($child, $depth + 1);
            if ($candidate && $candidate->ctype_secondary === 'plain') {
                return $candidate;
            }
            $html ??= $candidate;
        }
        return $html;
    }

    public static function text(string $body, bool $html): string
    {
        $body = rcube_charset::clean($body);
        if ($html) {
            $body = preg_replace('~<(head|style|script|title)\b[^>]*>.*?(?:</\1\s*>|$)~is', ' ', $body) ?? '';
            $body = preg_replace('~<!--.*?(?:-->|$)~s', ' ', $body) ?? '';
            $body = preg_replace('~<(?:br\b[^>]*|/(?:p|div|li|tr|h[1-6]))>~i', ' ', $body) ?? '';
            $body = html_entity_decode(strip_tags($body), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        } else {
            $body = explode("\n-- ", $body, 2)[0];
            $body = preg_replace('/^>.*$/m', '', $body) ?? '';
        }
        $body = preg_replace('/[\s\x{00a0}\x{200b}-\x{200f}\x{202a}-\x{202e}\x{2066}-\x{2069}\x{feff}\x{0000}-\x{001f}]+/u', ' ', $body) ?? '';
        $body = trim($body);
        return mb_strlen($body, 'UTF-8') > 140 ? rtrim(mb_substr($body, 0, 140, 'UTF-8')) . '…' : $body;
    }
}
