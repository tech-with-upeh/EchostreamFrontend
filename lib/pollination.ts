import { Buffer } from "buffer"; // Ensure this is installed or use an alternative if handling raw text
import { reportWarning } from "@/store/error.store";

const POLL_URL =
  process.env.EXPO_PUBLIC_POLLINATION_BASE_URL?.replace(/\/$/, "") ||
  "https://pollinations.ai";
const POLL_KEY = process.env.EXPO_PUBLIC_POLLINATION_KEY;

if (!process.env.EXPO_PUBLIC_POLLINATION_BASE_URL) {
  reportWarning(
    "EXPO_PUBLIC_POLLINATION_BASE_URL is not configured. Falling back to default gateway.",
  );
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  isBinary?: boolean;
}

async function rawPollRequest<T>(
  path: string,
  options: FetchOptions = {},
  token?: string | null,
): Promise<T> {
  if (!POLL_URL) throw new ApiError("Backend URL is not configured.", 0);

  let response: Response;
  const { isBinary, ...cleanOptions } = options;

  try {
    response = await fetch(`${POLL_URL}${path}`, {
      ...cleanOptions,
      headers: {
        Accept: isBinary ? "image/*" : "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach Pollination. Check your internet connection.",
      0,
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: unknown }).detail)
        : typeof body === "string" && body
          ? body
          : "Something went wrong. Please try again.";

    throw new ApiError(detail, response.status);
  }

  // Handle image generation binary blobs
  if (isBinary) {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64") as unknown as T;
  }

  return (await response.json()) as T;
}

interface AvatarFilter {
  gender: "Male" | "Female" | "Non-binary";
  description?: string;
  model?: string;
  country: string;
  language: string;
}

/**
 * Fetches an avatar from Pollinations matching specified structural criteria.
 * @returns Base64 image data string safe for React Native Image URI rendering
 */
export async function getAvatarImage({
  gender,
  country,
  language,
  description,
  model = "flux",
}: AvatarFilter): Promise<string> {
  // Construct the prompt string out of your explicit sorting arguments
  const extraDescription = description ? `, ${description}` : "";
  const refinedPrompt = `avatar face portrait photograph of a ${gender} from ${country} that speaks ${language} with name ${extraDescription}. clear lighting, center composition.`;

  // Format variables cleanly as query parameters for the image path route
  const path = `/image/${encodeURIComponent(refinedPrompt)}?model=${model}&enhance=true&width=500&height=500`;

  // Fetch the data stream directly from the API endpoint
  const base64Data = await rawPollRequest<string>(
    path,
    { method: "GET", isBinary: true },
    POLL_KEY,
  );

  return `data:image/jpeg;base64,${base64Data}`;
}

export function getImage(cap: string, model: string = "flux") {
  return rawPollRequest(POLL_URL || "", {}, POLL_KEY);
}
