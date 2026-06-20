import { createHmac, timingSafeEqual } from "node:crypto";

type RealtimeTokenPayload = {
  userId: number;
  gameId: number;
  exp: number;
};

function encodePayload(payload: RealtimeTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): RealtimeTokenPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as RealtimeTokenPayload;

    if (
      typeof parsed.userId !== "number" ||
      typeof parsed.gameId !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function signRealtimeToken(
  payload: Omit<RealtimeTokenPayload, "exp">,
  secret: string,
  ttlSeconds = 60 * 60,
): string {
  const fullPayload: RealtimeTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = encodePayload(fullPayload);
  const signature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyRealtimeToken(
  token: string,
  secret: string,
): RealtimeTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return secret;
}
