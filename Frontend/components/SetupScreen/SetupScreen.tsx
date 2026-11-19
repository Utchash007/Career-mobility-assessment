import ConfigurationNotice from "@/components/ConfigurationNotice/ConfigurationNotice";

export default function SetupScreen() {
  return (
    <main className="mx-auto min-h-svh max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-semibold">Career Mobility setup</h1>
      <ConfigurationNotice kind="authentication" />
      <p className="text-sm">No account or private application data is shown. The public health endpoint remains available.</p>
    </main>
  );
}
