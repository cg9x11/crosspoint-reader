const MOJIBAKE_MARKERS = /(?:Ã.|Â.|Ä.|Æ.|Ð.|Ñ.|á.|â€|â€™|â€œ|â€|â€¦|â€“|â€”)/g;
const VIETNAMESE_CHARS =
  /[ĂÂĐÊÔƠƯăâđêôơưÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/g;

function countMatches(input: string, pattern: RegExp) {
  return input.match(pattern)?.length ?? 0;
}

function looksLikeUtf8Mojibake(input: string) {
  return countMatches(input, MOJIBAKE_MARKERS) > 0;
}

function decodeLatin1AsUtf8(input: string) {
  return Buffer.from(input, "latin1").toString("utf8");
}

function scoreReadableVietnamese(input: string) {
  const vietnamese = countMatches(input, VIETNAMESE_CHARS);
  const mojibake = countMatches(input, MOJIBAKE_MARKERS);
  const replacement = input.includes("\uFFFD") ? 8 : 0;
  return vietnamese * 3 - mojibake * 4 - replacement;
}

export function repairPossiblyMojibake(input: string) {
  if (!input || !looksLikeUtf8Mojibake(input)) {
    return input;
  }

  const decoded = decodeLatin1AsUtf8(input);
  return scoreReadableVietnamese(decoded) > scoreReadableVietnamese(input) ? decoded : input;
}

export function repairJsonStringsDeep<T>(value: T): T {
  if (typeof value === "string") {
    return repairPossiblyMojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairJsonStringsDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      output[key] = repairJsonStringsDeep(entryValue);
    }
    return output as T;
  }

  return value;
}
