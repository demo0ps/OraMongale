import PostJobForm from "./PostJobForm";

export const metadata = { title: "Post a haulage need" };

export default function PostJobPage() {
  return (
    <div className="bg-white">
      <section className="bg-ink text-white py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-xs uppercase tracking-widest text-gold mb-3">
            For mines & contractors
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Tell us what you need moved.
          </h1>
          <p className="mt-3 text-bone/90 max-w-xl">
            Fill in what you know — a coordinator will call you back within one
            business day with confirmed capacity. There is no charge to submit a
            haulage need.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="card p-6 sm:p-8">
          <PostJobForm />
        </div>
        <p className="mt-5 text-xs text-steel">
          By submitting this form you agree that we may contact you about your
          haulage requirement. We do not share your details with hauliers until
          we have spoken to you.
        </p>
      </section>
    </div>
  );
}
