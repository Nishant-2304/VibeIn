type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = "Loading..." }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#121212] px-5 text-gray-400">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#9b72cf] border-t-transparent" />
      <p className="text-sm font-medium">{label}</p>
    </main>
  );
}
