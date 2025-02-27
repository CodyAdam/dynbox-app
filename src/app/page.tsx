"use client";

import { env } from "@/env.mjs";
import { useTauriStore } from "@/lib/store";
import Link from "next/link";

export default function Home() {
  const { data, update, isLoading, error } = useTauriStore("token", undefined);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      First step: Login to your account
      <pre>{JSON.stringify({ data, isLoading, error }, null, 2)}</pre>
      <Link
        target="_blank"
        href={`${env.NEXT_PUBLIC_APP_URL}/account/authorize?clientId=dynbox-app&redirectUri=dynbox://authorize`}
      >
        Authenticate with your browser
      </Link>
      <button
        onClick={() => {
          update(Math.random().toString());
        }}
      >
        test change token random
      </button>
    </div>
  );
}
