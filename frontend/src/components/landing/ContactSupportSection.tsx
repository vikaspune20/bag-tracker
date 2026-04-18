import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScrollReveal } from './ScrollReveal';
import { cn } from '../../lib/cn';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Tell us a bit more (at least 10 characters)'),
});

type FormValues = z.infer<typeof schema>;

export function ContactSupportSection() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (_data: FormValues) => {
    reset();
  };

  const field = (hasError: boolean) =>
    cn(
      'w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-landing-text outline-none transition placeholder:text-slate-400',
      'focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15',
      hasError ? 'border-red-400/70' : 'border-slate-200/90 hover:border-slate-300'
    );

  return (
    <section
      id="section-contact"
      className="scroll-mt-24 border-t border-slate-200/90 bg-landing-bg px-5 py-24 md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-xl">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">
              Support
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
              We&apos;re here to help
            </h2>
            <p className="mt-3 text-landing-muted">
              Questions about tracking, partnerships, or enterprise — send a note.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={80}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="glass-panel-light mt-12 p-8 shadow-neon-soft md:p-10"
            noValidate
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-xs font-medium text-landing-muted">
                  Name
                </label>
                <input
                  id="contact-name"
                  autoComplete="name"
                  placeholder="Your name"
                  className={field(!!errors.name)}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-xs font-medium text-landing-muted">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={field(!!errors.email)}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-2 block text-xs font-medium text-landing-muted">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="How can we help?"
                  className={cn(field(!!errors.message), 'min-h-[140px] resize-y')}
                  {...register('message')}
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.message.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn-ripple mt-8 w-full rounded-full bg-gradient-to-r from-neon-blue to-neon-teal py-3.5 text-sm font-semibold text-white shadow-neon-soft transition hover:brightness-110"
            >
              Submit
            </button>

            {isSubmitSuccessful && (
              <p className="mt-6 text-center text-sm text-teal-600" role="status">
                Thanks — we&apos;ll get back to you shortly.
              </p>
            )}
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
}
