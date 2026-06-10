import { searchStories } from "../../../lib/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || 40), 80);

  if (query.trim().length < 2) {
    return Response.json({ query, results: [] });
  }

  const results = await searchStories(query, limit);
  return Response.json({ query, results });
}
