import { env } from "@/env.mjs";
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./api";

const fetchClient = createFetchClient<paths>({
  baseUrl: `${env.NEXT_PUBLIC_APP_URL}/api`,
  credentials: 'include',
});
export const api = createClient(fetchClient);
