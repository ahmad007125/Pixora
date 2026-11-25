import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F8FAFD] px-6 text-center dark:bg-[#0F141C]">
      <p className="text-sm font-medium text-[#1A73E8] dark:text-[#8AB4F8]">404</p>
      <h1 className="font-display mt-2 text-3xl font-bold text-[#202124] dark:text-[#F1F3F4]">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-[#5F6368] dark:text-[#9AA0A6]">
        That URL is not part of the Pixora studio. Head home or open the journal.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[#4285F4] px-4 py-2 text-sm font-medium text-white hover:bg-[#1A73E8]"
        >
          Go home
        </Link>
        <Link
          href="/blog"
          className="rounded-xl border border-[#DADCE0] px-4 py-2 text-sm font-medium text-[#202124] dark:border-[#2B3340] dark:text-[#F1F3F4]"
        >
          Read the blog
        </Link>
      </div>
    </div>
  );
}
