/**
 * S-01: ログイン / サインアップ
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

async function handleLogin(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/teams" });
  } catch (e) {
    const err = e as { code?: string; type?: string };
    if (err?.code === "CredentialsSignin" || err?.type === "CredentialsSignin") {
      redirect("/login?error=CredentialsSignin");
    }
    throw e;
  }
}

async function handleGoogleLogin() {
  "use server";
  await signIn("google", { redirectTo: "/teams" });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const isCredentialsError = params.error === "CredentialsSignin";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">SMART Team Goals</h1>
          <p className="mt-1 text-sm text-gray-500">ログインしてチームのゴールを管理しましょう</p>
        </header>

        {isCredentialsError && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            メールアドレスまたはパスワードが正しくありません。アカウントがない場合はサインアップしてください。
          </div>
        )}
        {params.registered === "1" && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            登録が完了しました。ログインしてください。
          </div>
        )}

        <form action={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            メールアドレスでログイン
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="px-3 text-xs text-gray-400">または</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form action={handleGoogleLogin}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="inline-block h-4 w-4 rounded-full bg-red-500" aria-hidden="true" />
            <span>Google でログイン</span>
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          アカウントがない場合は
          <Link href="/signup" className="ml-1 text-indigo-600 hover:underline">
            サインアップ
          </Link>
          または Google でログインしてください。
        </p>
      </div>
    </main>
  );
}