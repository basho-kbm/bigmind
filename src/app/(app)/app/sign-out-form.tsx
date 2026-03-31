import { signOut } from "@/app/login/actions";

export function SignOutForm() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-left text-sm text-stone-200 transition hover:border-stone-500 hover:text-white"
      >
        Sign out
      </button>
    </form>
  );
}
