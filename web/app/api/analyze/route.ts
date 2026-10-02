import type { DashboardSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || process.env.WORKER_URL;

  if (!workerUrl) {
    return Response.json(
      { error: "Worker URL not configured. Set NEXT_PUBLIC_WORKER_URL." },
      { status: 503 }
    );
  }

  let snapshot: DashboardSnapshot;
  try {
    snapshot = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${workerUrl.replace(/\/$/, "")}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "Worker error");
      return Response.json(
        { error: `Worker returned ${res.status}`, detail: text },
        { status: 502 }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return Response.json(
      { error: "Could not reach analysis worker", detail: message },
      { status: 502 }
    );
  }
}
