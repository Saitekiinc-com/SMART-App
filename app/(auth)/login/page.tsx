/**
 * S-01: ログイン / サインアップ
 * AuthForm を配置
 */
import { signIn } from "@/auth";

async function handleLogin(formData: FormData) {
  "use server";
  await signIn("credentials", formData);
}

async function handleGoogleLogin() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}

export default function LoginPage() {
  return (
    <main>
      <form action={handleLogin}>
        <input name="email" type="email" />
        <input name="password" type="password" />
        <button type="submit">ログイン</button>
      </form>

      <form action={handleGoogleLogin}>
        <button type="submit">Google でログイン</button>
      </form>
    </main>
  );
}