import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';
import { allUsCities, usCitiesByStateLabel, usStates } from '../data/usData';
import { AutocompleteInput } from '../components/common/AutocompleteInput';
import { loadGoogleMapsScript } from '../utils/loadGoogleMapsScript';
import { parseGooglePlaceComponents } from '../utils/parseGooglePlaceAddress';
import jcSmartbagLogo from '../../image.png';

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
    <div className="min-h-screen bg-[#e9eff4] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">
        <div className="bg-gradient-to-b from-[#0d8ec2] to-[#06a8d7] p-12 text-white hidden md:flex md:flex-col md:justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95 shadow-sm">
              <img
                src={jcSmartbagLogo}
                alt="JC SMARTBAG"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">JC SMARTBAG</span>
          </div>
          <p className="text-4xl font-semibold leading-tight">Join JC SMARTBAG Today</p>
          <p className="mt-4 text-lg text-white/90">Create your account and start tracking your baggage with confidence.</p>
        </div>
        <div className="p-10">
        
        <div className="text-center mb-8">
            <div className="flex justify-center md:hidden mb-5">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">
                <img
                  src={jcSmartbagLogo}
                  alt="JC SMARTBAG"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">
               Fill in your details to get started
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm text-center font-medium">{error}</div>}
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input name="fullName" required aria-invalid={!!fieldErrors.fullName} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3" />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input name="email" type="email" required aria-invalid={!!fieldErrors.email} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3" />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input name="phone" required aria-invalid={!!fieldErrors.phone} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3" />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              {useOpenStreetMap ? (
                <>
                  <div className="relative">
                    <input
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
                      placeholder="Search address (OpenStreetMap)…"
                      className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3"
                    />
                    {addressOpen && (addressLoading || addressSuggestions.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                        {addressLoading && (
                          <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
                        )}
                        {!addressLoading &&
                          addressSuggestions.map((s) => (
                            <button
                              key={s.place_id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
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
                              <div className="text-gray-900">{s.display_name}</div>
                            </button>
                          ))}
                        {!addressLoading && addressSuggestions.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
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
                    ref={addressInputRef}
                    name="address"
                    required
                    aria-invalid={!!fieldErrors.address}
                    autoComplete="street-address"
                    placeholder={
                      placesJsReady ? 'Start typing your street address…' : 'Street address (loading suggestions…)'
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
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
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3"
                />
                {fieldErrors.state && <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
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
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3"
                />
                {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  name="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  aria-invalid={!!fieldErrors.country}
                  autoComplete="country-name"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3"
                />
                {fieldErrors.country && <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zipcode / Postal Code</label>
                <input
                  name="zip"
                  required
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value);
                  }}
                  aria-invalid={!!fieldErrors.zip}
                  autoComplete="postal-code"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3"
                />
                {fieldErrors.zip && <p className="mt-1 text-xs text-red-600">{fieldErrors.zip}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Identification Number / SSN</label>
              <input name="identificationNo" required aria-invalid={!!fieldErrors.identificationNo} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3" />
              {fieldErrors.identificationNo && <p className="mt-1 text-xs text-red-600">{fieldErrors.identificationNo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input name="password" type="password" required aria-invalid={!!fieldErrors.password} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3" />
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input name="confirmPassword" type="password" required aria-invalid={!!fieldErrors.confirmPassword} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3" />
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
             <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-3 bg-airline-blue text-white font-bold rounded-lg shadow-md hover:bg-airline-dark disabled:opacity-50 transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : 'Create Account'}
              </button>
              <p className="text-center text-sm mt-4 text-gray-500">Already have an account? <Link className="text-airline-blue font-semibold" to="/login">Sign In</Link></p>
          </div>

        </form>
      </div>
      </div>
    </div>
  );
};
