const CACHE_CONTROL = "public, max-age=31536000, immutable";
const NOTION_ID_RE = /^[a-f0-9]{32}$|^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const isAllowedRemoteHost = (hostname) =>
  hostname === "www.notion.so" ||
  hostname.endsWith(".notion.so") ||
  hostname.endsWith(".notionusercontent.com") ||
  hostname.endsWith(".amazonaws.com");

const isAllowedSource = (src) => {
  if (!src) return false;
  if (src.startsWith("attachment:")) return true;
  if (src.startsWith("/images/") || src.startsWith("/image/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && isAllowedRemoteHost(url.hostname);
  } catch {
    return false;
  }
};

const buildRemoteImageUrl = ({ src, id, table }) => {
  if (src.startsWith("/images/")) {
    return new URL(src, "https://www.notion.so").toString();
  }

  if (src.startsWith("/image/")) {
    return new URL(src, "https://www.notion.so").toString();
  }

  if (src.startsWith("https://www.notion.so/image/")) {
    return src;
  }

  const imageUrl = new URL(
    `/image/${encodeURIComponent(src)}`,
    "https://www.notion.so"
  );
  imageUrl.searchParams.set("table", table);
  imageUrl.searchParams.set("id", id);
  imageUrl.searchParams.set("cache", "v2");

  return imageUrl.toString();
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");
  const id = searchParams.get("id");
  const table = searchParams.get("table") === "collection" ? "collection" : "block";

  if (!src || !id || !NOTION_ID_RE.test(id) || !isAllowedSource(src)) {
    return new Response("Invalid image source", { status: 400 });
  }

  const remoteUrl = buildRemoteImageUrl({ src, id, table });
  const imageResponse = await fetch(remoteUrl, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!imageResponse.ok) {
    return new Response("Image fetch failed", { status: imageResponse.status });
  }

  const contentType = imageResponse.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return new Response("Unsupported image response", { status: 415 });
  }

  return new Response(imageResponse.body, {
    status: 200,
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": contentType,
    },
  });
}
