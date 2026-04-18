import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Bell, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { allUsCities, usCitiesByStateLabel, usStates } from '../data/usData';
import { AutocompleteInput } from '../components/common/AutocompleteInput';
import { loadGoogleMapsScript } from '../utils/loadGoogleMapsScript';
import { parseGooglePlaceComponents } from '../utils/parseGooglePlaceAddress';
import { LandingNav, ScrollProgress } from '../components/landing';
import { cn } from '../lib/cn';

const labelClass = 'mb-1.5 block text-xs font-medium text-landing-muted';

const inputBaseClass =
  'block w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-landing-text outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15';

function inputClassName(invalid: boolean) {
  return cn(
    inputBaseClass,
    invalid && 'border-red-300 focus:border-red-400 focus:ring-red-500/15'
  );
}

type AddressSuggestion = {
  place_id: number;
  display_name: string;
  address: Record<string, string | undefined>;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function pickNominatimCity(addr: Record<string, string | undefined>) {
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    addr.municipality ||
    addr.city_district ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.county ||
    ''
  );
}

function nominatimIso3166Lvl4(addr: Record<string, string | undefined>) {
  for (const key of Object.keys(addr)) {
    if (key.toLowerCase() === 'iso3166-2-lvl4') {
      const v = addr[key];
      if (v) return v;
    }
  }
  return '';
}

function pickNominatimStateRaw(addr: Record<string, string | undefined>) {
  const countryCode = normalizeWhitespace(addr.country_code || '').toLowerCase();

  // Prefer ISO subdivision for US *before* state_district — Nominatim often puts counties /
  // districts in `state_district`, which would block reading `US-XX` from ISO3166-2-lvl4.
  const isoTrim = normalizeWhitespace(nominatimIso3166Lvl4(addr));
  const usMatch = isoTrim.match(/^US-([A-Z]{2})$/i);
  if (usMatch) return usMatch[1].toUpperCase();

  const direct =
    normalizeWhitespace(addr.state || '') ||
    normalizeWhitespace(addr.region || '') ||
    normalizeWhitespace(addr.province || '');
  if (direct) return direct;

  if (countryCode !== 'us') {
    const sd = normalizeWhitespace(addr.state_district || '');
    if (sd) return sd;
  }

  const usStateDistrict = normalizeWhitespace(addr.state_district || '');
  if (countryCode === 'us' && usStateDistrict) return usStateDistrict;

  return '';
}

function nominatimStateRawToUsStateLabel(stateRaw: string): string {
  const t = normalizeWhitespace(stateRaw);
  if (!t) return '';
  const byCode = usStates.find(
    (s) => s.isoCode === t || s.isoCode.toLowerCase() === t.toLowerCase()
  );
  if (byCode) return byCode.label;
  const byName = usStates.find((s) => s.name.toLowerCase() === t.toLowerCase());
  if (byName) return byName.label;
  const byParen = usStates.find((s) => t.toLowerCase() === `${s.name.toLowerCase()} (${s.isoCode.toLowerCase()})`);
  return byParen ? byParen.label : '';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLikelyPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function isValidUSZip(zip: string) {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}

export const Register = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [cityAutofilled, setCityAutofilled] = useState(false);
  const [country, setCountry] = useState('United States');
  const [zip, setZip] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [placesJsReady, setPlacesJsReady] = useState(false);
  const [placesLoadError, setPlacesLoadError] = useState('');
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const activeAddressFetch = useRef<AbortController | null>(null);
  const addressBlurTimeout = useRef<number | null>(null);
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const addressProviderRaw = (
    import.meta.env.VITE_ADDRESS_AUTOCOMPLETE_PROVIDER as string | undefined
  )
    ?.trim()
    .toLowerCase();
  const useGooglePlaces = addressProviderRaw === 'google';
  const useOpenStreetMap = !useGooglePlaces;

  const googleMapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();

  const cityOptions = useMemo(() => {
    const forState = usCitiesByStateLabel[selectedState] || [];
    return forState.length > 0 ? forState : allUsCities;
  }, [selectedState]);

  useEffect(() => {
    if (!useGooglePlaces || !googleMapsApiKey) return;
    let cancelled = false;
    setPlacesJsReady(false);
    setPlacesLoadError('');
    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        if (!cancelled) setPlacesJsReady(true);
      })
      .catch(() => {
        if (!cancelled) setPlacesLoadError('Could not load address suggestions. You can still type your address manually.');
      });
    return () => {
      cancelled = true;
    };
  }, [useGooglePlaces, googleMapsApiKey]);

  useEffect(() => {
    if (!useGooglePlaces || !placesJsReady || !googleMapsApiKey) return;
    const input = addressInputRef.current;
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['address'],
      fields: ['address_components', 'formatted_address'],
      componentRestrictions: { country: 'us' },
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components?.length) return;

      const parsed = parseGooglePlaceComponents(
        place.address_components,
        place.formatted_address || input.value,
        usStates
      );

      if (parsed.formattedAddress) input.value = parsed.formattedAddress;
      if (parsed.country) setCountry(parsed.country);
      if (parsed.zip) setZip(parsed.zip);

      if (parsed.stateLabel) {
        setSelectedState(parsed.stateLabel);
        const citiesForState = usCitiesByStateLabel[parsed.stateLabel] || [];
        if (parsed.city) {
          if (citiesForState.length === 0 || citiesForState.includes(parsed.city)) {
            setCity(parsed.city);
            setCityAutofilled(true);
          } else {
            setCity('');
            setCityAutofilled(false);
          }
        }
      } else if (parsed.city) {
        setCity(parsed.city);
        setCityAutofilled(true);
      }
    });

    return () => {
      listener.remove();
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [useGooglePlaces, placesJsReady, googleMapsApiKey]);

  useEffect(() => {
    if (!useOpenStreetMap) return;

    const q = normalizeWhitespace(addressQuery);
    if (q.length < 3) {
      if (activeAddressFetch.current) activeAddressFetch.current.abort();
      setAddressSuggestions([]);
      setAddressLoading(false);
      return;
    }

    setAddressLoading(true);
    if (activeAddressFetch.current) activeAddressFetch.current.abort();
    const controller = new AbortController();
    activeAddressFetch.current = controller;

    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: 'json',
          addressdetails: '1',
          limit: '6',
          countrycodes: 'us',
          q,
        });
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!resp.ok) throw new Error('Address search failed');
        const json = (await resp.json()) as any[];
        const suggestions: AddressSuggestion[] = (json || []).map((r) => ({
          place_id: r.place_id,
          display_name: r.display_name,
          address: r.address || {},
        }));
        setAddressSuggestions(suggestions);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setAddressSuggestions([]);
      } finally {
        setAddressLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, [useOpenStreetMap, addressQuery]);

  const validate = (data: Record<string, string>) => {
    const nextErrors: Record<string, string> = {};

    const fullName = normalizeWhitespace(data.fullName || '');
    const email = normalizeWhitespace(data.email || '').toLowerCase();
    const phone = normalizeWhitespace(data.phone || '');
    const address = normalizeWhitespace(data.address || '');
    const state = normalizeWhitespace(data.state || '');
    const cityValue = normalizeWhitespace(data.city || '');
    const countryValue = normalizeWhitespace(data.country || '');
    const zipValue = normalizeWhitespace(data.zip || '');
    const identificationNo = normalizeWhitespace(data.identificationNo || '');
    const password = data.password || '';
    const confirmPassword = data.confirmPassword || '';

    if (!fullName) nextErrors.fullName = 'Full name is required.';
    if (!email) nextErrors.email = 'Email is required.';
    else if (!isValidEmail(email)) nextErrors.email = 'Please enter a valid email address.';

    if (!phone) nextErrors.phone = 'Mobile number is required.';
    else if (!isLikelyPhone(phone)) nextErrors.phone = 'Please enter a valid mobile number.';

    if (!address) nextErrors.address = 'Address is required.';
    if (!state) nextErrors.state = 'State is required.';
    if (!cityValue) nextErrors.city = 'City is required.';
    if (!countryValue) nextErrors.country = 'Country is required.';
    if (!zipValue) nextErrors.zip = 'Zip/Pincode is required.';

    const citiesForState = usCitiesByStateLabel[state] || [];
    if (state && cityValue && citiesForState.length > 0 && !citiesForState.includes(cityValue)) {
      if (!cityAutofilled) nextErrors.city = 'Please select a city that belongs to the selected state.';
    }

    if (zipValue && countryValue.toLowerCase().includes('united states') && !isValidUSZip(zipValue)) {
      nextErrors.zip = 'Please enter a valid US ZIP (e.g. 12345 or 12345-6789).';
    }

    if (!identificationNo) nextErrors.identificationNo = 'Identification number / SSN is required.';

    if (!password) nextErrors.password = 'Password is required.';
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    return { ok: Object.keys(nextErrors).length === 0, errors: nextErrors };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;
    const result = validate(data);
    if (!result.ok) {
      setFieldErrors(result.errors);
      setLoading(false);
      return;
    }

    try {
      const resp = await api.post('/auth/register', data);
      loginAction(resp.data.user, resp.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen scroll-smooth bg-landing-bg font-sans text-landing-text antialiased">
      <ScrollProgress />
      <LandingNav />
      <main className="relative pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-hero-mesh-light opacity-[0.35]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16 lg:items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none lg:pr-2">
                <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm shadow-slate-200/40 backdrop-blur-md md:p-8">
                  <div className="flex flex-col gap-6 sm:gap-7">
                    <div>
                      <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-800">
                        Sign up
                      </span>
                      <h1 className="mt-4 text-balance font-display text-[1.65rem] font-bold leading-[1.15] tracking-tight text-landing-text sm:text-3xl md:text-[2rem]">
                        Create your account
                      </h1>
                      <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-landing-muted md:text-[0.9375rem]">
                        One login for live baggage tracking, trip history, and alerts—the same product story as the
                        homepage, without leaving the brand.
                      </p>
                    </div>

                    <ul className="flex flex-col gap-3">
                      <li className="flex gap-4 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-400/15 text-cyan-700 ring-1 ring-cyan-500/15">
                          <MapPin className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-landing-text">Live journey tracking</p>
                          <p className="mt-0.5 text-sm leading-snug text-landing-muted">
                            Status from check-in through delivery
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-4 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-400/10 text-teal-800 ring-1 ring-teal-500/15">
                          <ShieldCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-landing-text">Secure updates</p>
                          <p className="mt-0.5 text-sm leading-snug text-landing-muted">
                            Alerts when your bags move
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-4 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-slate-100/80 text-cyan-800 ring-1 ring-slate-200/80">
                          <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-landing-text">Everything in one place</p>
                          <p className="mt-0.5 text-sm leading-snug text-landing-muted">
                            Trips and registered bags together
                          </p>
                        </div>
                      </li>
                    </ul>

                    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-slate-200/70 pt-5 text-sm text-landing-muted">
                      <Link
                        to="/login"
                        className="font-semibold text-cyan-700 underline-offset-4 transition hover:text-cyan-800 hover:underline"
                      >
                        Sign in
                      </Link>
                      <span className="mx-2 hidden h-3 w-px bg-slate-200 sm:inline" aria-hidden />
                      <Link
                        to="/home"
                        className="font-semibold text-cyan-700 underline-offset-4 transition hover:text-cyan-800 hover:underline"
                      >
                        Back to home
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="glass-panel-light overflow-hidden p-6 shadow-neon-soft md:p-8">
                <div className="mb-8 text-center md:text-left">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-landing-text md:text-3xl">
                    Registration
                  </h2>
                  <p className="mt-2 text-sm text-landing-muted">Fill in your details to get started</p>
                </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {error && (
            <div className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-center text-sm font-medium text-red-800">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 md:gap-5">
            <div>
              <label className={labelClass} htmlFor="reg-fullName">Full Name</label>
              <input id="reg-fullName" name="fullName" required aria-invalid={!!fieldErrors.fullName} className={inputClassName(!!fieldErrors.fullName)} />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
            </div>
            
            <div>
              <label className={labelClass} htmlFor="reg-email">Email Address</label>
              <input id="reg-email" name="email" type="email" required aria-invalid={!!fieldErrors.email} className={inputClassName(!!fieldErrors.email)} />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="reg-phone">Mobile Number</label>
              <input id="reg-phone" name="phone" required aria-invalid={!!fieldErrors.phone} className={inputClassName(!!fieldErrors.phone)} />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="reg-address">Address</label>
              {useOpenStreetMap ? (
                <>
                  <div className="relative">
                    <input
                      id="reg-address"
                      name="address"
                      required
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value);
                        setAddressOpen(true);
                      }}
                      onFocus={() => setAddressOpen(true)}
                      onBlur={() => {
                        if (addressBlurTimeout.current) window.clearTimeout(addressBlurTimeout.current);
                        addressBlurTimeout.current = window.setTimeout(() => setAddressOpen(false), 150);
                      }}
                      aria-invalid={!!fieldErrors.address}
                      autoComplete="street-address"
                      placeholder="Search address…"
                      className={inputClassName(!!fieldErrors.address)}
                    />
                    {addressOpen && (addressLoading || addressSuggestions.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden overflow-y-auto rounded-xl border border-slate-200/90 bg-white shadow-neon-soft max-h-64">
                        {addressLoading && (
                          <div className="px-3 py-2 text-sm text-landing-muted">Searching…</div>
                        )}
                        {!addressLoading &&
                          addressSuggestions.map((s) => (
                            <button
                              key={s.place_id}
                              type="button"
                              className="w-full text-left px-3 py-2.5 text-sm text-landing-text transition hover:bg-cyan-50/80"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setAddressQuery(s.display_name);
                                const addr = s.address || {};
                                const nextCity = pickNominatimCity(addr);
                                const stateLabel = nominatimStateRawToUsStateLabel(pickNominatimStateRaw(addr));
                                const nextCountry = addr.country || country;
                                const nextZip = addr.postcode || '';
                                if (stateLabel) {
                                  setSelectedState(stateLabel);
                                  if (nextCity) {
                                    setCity(nextCity);
                                    setCityAutofilled(true);
                                  }
                                } else if (nextCity) {
                                  setCity(nextCity);
                                  setCityAutofilled(true);
                                }
                                if (nextCountry) setCountry(nextCountry);
                                if (nextZip) setZip(nextZip);
                                setAddressOpen(false);
                              }}
                            >
                              {s.display_name}
                            </button>
                          ))}
                        {!addressLoading && addressSuggestions.length === 0 && (
                          <div className="px-3 py-2 text-sm text-landing-muted">
                            No matches. You can type the address manually.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                </>
              ) : (
                <>
                  <input
                    id="reg-address-google"
                    ref={addressInputRef}
                    name="address"
                    required
                    aria-invalid={!!fieldErrors.address}
                    autoComplete="street-address"
                    placeholder={
                      placesJsReady ? 'Start typing your street address…' : 'Street address (loading suggestions…)'
                    }
                    className={inputClassName(!!fieldErrors.address)}
                  />
                  {!googleMapsApiKey && (
                    <p className="mt-1 text-xs text-amber-800">
                      Provider is <span className="font-mono">google</span> — add{' '}
                      <span className="font-mono">VITE_GOOGLE_MAPS_API_KEY</span>. You can still enter your address
                      manually.
                    </p>
                  )}
                  {placesLoadError && <p className="mt-1 text-xs text-amber-800">{placesLoadError}</p>}
                </>
              )}
              {fieldErrors.address && <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <div>
                <label className={labelClass} htmlFor="reg-state">State</label>
                <AutocompleteInput
                  name="state"
                  required
                  value={selectedState}
                  onChange={(next) => setSelectedState(next)}
                  onSelect={(next) => {
                    // If the selected state changes, keep city only if it still matches the state's options
                    const citiesForState = usCitiesByStateLabel[next] || [];
                    if (citiesForState.length > 0 && city && !citiesForState.includes(city)) setCity('');
                  }}
                  options={usStates.map((s) => s.label)}
                  ariaInvalid={!!fieldErrors.state}
                  autoComplete="address-level1"
                  className={inputClassName(!!fieldErrors.state)}
                />
                {fieldErrors.state && <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="reg-city">City</label>
                <AutocompleteInput
                  name="city"
                  required
                  value={city}
                  onChange={(next) => {
                    setCity(next);
                    setCityAutofilled(false);
                  }}
                  options={cityOptions}
                  ariaInvalid={!!fieldErrors.city}
                  autoComplete="address-level2"
                  className={inputClassName(!!fieldErrors.city)}
                />
                {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <div>
                <label className={labelClass} htmlFor="reg-country">Country</label>
                <input
                  id="reg-country"
                  name="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  aria-invalid={!!fieldErrors.country}
                  autoComplete="country-name"
                  className={inputClassName(!!fieldErrors.country)}
                />
                {fieldErrors.country && <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="reg-zip">Zipcode / Postal Code</label>
                <input
                  id="reg-zip"
                  name="zip"
                  required
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value);
                  }}
                  aria-invalid={!!fieldErrors.zip}
                  autoComplete="postal-code"
                  className={inputClassName(!!fieldErrors.zip)}
                />
                {fieldErrors.zip && <p className="mt-1 text-xs text-red-600">{fieldErrors.zip}</p>}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="reg-id">Identification Number / SSN</label>
              <input id="reg-id" name="identificationNo" required aria-invalid={!!fieldErrors.identificationNo} className={inputClassName(!!fieldErrors.identificationNo)} />
              {fieldErrors.identificationNo && <p className="mt-1 text-xs text-red-600">{fieldErrors.identificationNo}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="reg-password">Password</label>
              <input id="reg-password" name="password" type="password" required aria-invalid={!!fieldErrors.password} className={inputClassName(!!fieldErrors.password)} />
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" name="confirmPassword" type="password" required aria-invalid={!!fieldErrors.confirmPassword} className={inputClassName(!!fieldErrors.confirmPassword)} />
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-6">
             <button
                type="submit"
                disabled={loading}
                className="btn-ripple flex w-full items-center justify-center rounded-full bg-gradient-to-r from-neon-blue to-neon-teal px-8 py-3.5 text-sm font-semibold text-white shadow-neon-soft transition hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
              </button>
              <p className="mt-4 text-center text-sm text-landing-muted">
                Already have an account?{' '}
                <Link className="font-semibold text-cyan-700 transition hover:text-cyan-800" to="/login">
                  Sign In
                </Link>
              </p>
          </div>

        </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
