import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");
  const backendUrl = process.env.NEXT_PUBLIC__URL_BACKEND;

  if (!imageUrl || !backendUrl) {
    return NextResponse.json({ detail: "URL de imagen inválida." }, { status: 400 });
  }

  try {
    const allowedBackend = new URL(backendUrl.trim());
    const requestedUrl = new URL(imageUrl, allowedBackend);

    if (requestedUrl.origin !== allowedBackend.origin) {
      return NextResponse.json({ detail: "Origen de imagen no permitido." }, { status: 403 });
    }

    const response = await fetch(requestedUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ detail: "No se pudo obtener la imagen." }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ detail: "El recurso no es una imagen." }, { status: 415 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ detail: "URL de imagen inválida." }, { status: 400 });
  }
}
