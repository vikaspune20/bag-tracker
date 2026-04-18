import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

const schema = z.object({
  bagName: z.string().min(2, 'Enter a bag name'),
  trip: z.string().min(2, 'Enter trip or destination'),
  trackingId: z.string().min(4, 'Tracking ID or QR data required'),
  travelDate: z.string().min(1, 'Pick a travel date'),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'peer block w-full rounded-xl border border-slate-200/90 bg-white px-4 pb-2.5 pt-6 text-sm text-landing-text outline-none transition placeholder:text-transparent focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15';

const labelClass =
  'pointer-events-none absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 text-xs text-landing-muted duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-cyan-600';

export function RegisterBagSection() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur' });

  return (
    <section
      id="section-register"
      className="relative flex min-h-0 items-center justify-center overflow-hidden bg-gradient-to-b from-landing-bg via-white/50 to-landing-surface px-5 py-24 md:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(45,212,191,0.1),transparent_50%)]" />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
            Register Your Bag
          </h2>
          <p className="mt-3 text-landing-muted">
            Add a bag to your journey. Full account features live in the app.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(() => {
            /* API-ready: POST /bags */
          })}
          className="glass-panel-light p-8 shadow-neon-soft md:p-10"
          noValidate
        >
          <div className="space-y-6">
            <div className="relative">
              <input
                id="bagName"
                className={cn(fieldClass, errors.bagName && 'border-red-400/70 focus:ring-red-400/15')}
                placeholder=" "
                {...register('bagName')}
              />
              <label htmlFor="bagName" className={labelClass}>
                Bag Name
              </label>
              {errors.bagName && (
                <p className="mt-1.5 text-xs text-red-600">{errors.bagName.message}</p>
              )}
            </div>

            <div className="relative">
              <input
                id="trip"
                className={cn(fieldClass, errors.trip && 'border-red-400/70')}
                placeholder=" "
                {...register('trip')}
              />
              <label htmlFor="trip" className={labelClass}>
                Trip / Destination
              </label>
              {errors.trip && <p className="mt-1.5 text-xs text-red-600">{errors.trip.message}</p>}
            </div>

            <div className="relative">
              <input
                id="trackingId"
                className={cn(fieldClass, errors.trackingId && 'border-red-400/70')}
                placeholder=" "
                {...register('trackingId')}
              />
              <label htmlFor="trackingId" className={labelClass}>
                Tracking ID or QR Code
              </label>
              {errors.trackingId && (
                <p className="mt-1.5 text-xs text-red-600">{errors.trackingId.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="travelDate"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-landing-muted"
              >
                Travel Date
              </label>
              <input
                id="travelDate"
                type="date"
                className={cn(
                  'block w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-landing-text outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15',
                  errors.travelDate && 'border-red-400/70'
                )}
                {...register('travelDate')}
              />
              {errors.travelDate && (
                <p className="mt-1.5 text-xs text-red-600">{errors.travelDate.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-ripple mt-10 w-full rounded-full bg-gradient-to-r from-neon-blue to-neon-teal py-3.5 text-sm font-semibold text-white shadow-neon-soft transition hover:brightness-110"
          >
            Start Tracking
          </button>

          <p className="mt-6 text-center text-xs text-landing-muted">
            Prefer the full experience?{' '}
            <Link to="/register" className="text-teal-600 underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
