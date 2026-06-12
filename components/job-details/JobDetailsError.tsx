type Props = {
  message: string;
  title: string;
};

export function JobDetailsError({ message, title }: Props) {
  return (
    <section className="rounded-xl border border-error/20 bg-surface p-6 shadow-sm">
      <h1 className="text-base font-semibold leading-6 text-text-primary">{title}</h1>
      <p className="mt-3 text-sm font-medium leading-5 text-text-secondary">{message}</p>
    </section>
  );
}
