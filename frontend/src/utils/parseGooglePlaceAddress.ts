type UsStateOption = { isoCode: string; name: string; label: string };

export type ParsedGooglePlace = {
  formattedAddress: string;
  city: string;
  stateLabel: string;
  country: string;
  zip: string;
};

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  longName: boolean
): string {
  const c = components.find((x) => x.types.includes(type));
  if (!c) return '';
  return longName ? c.long_name : c.short_name;
}

export function parseGooglePlaceComponents(
  components: google.maps.GeocoderAddressComponent[],
  formattedAddress: string,
  usStates: UsStateOption[]
): ParsedGooglePlace {
  const city =
    getComponent(components, 'locality', true) ||
    getComponent(components, 'sublocality', true) ||
    getComponent(components, 'administrative_area_level_2', true) ||
    '';

  const shortState = getComponent(components, 'administrative_area_level_1', false);
  const longState = getComponent(components, 'administrative_area_level_1', true);
  const country = getComponent(components, 'country', true);
  const zip = getComponent(components, 'postal_code', true);

  let stateLabel = '';
  if (shortState || longState) {
    const shortNorm = shortState.trim();
    const longNorm = longState.trim();
    const byCode = usStates.find(
      (s) =>
        (shortNorm && s.isoCode === shortNorm) ||
        (shortNorm && s.isoCode.toLowerCase() === shortNorm.toLowerCase())
    );
    if (byCode) stateLabel = byCode.label;
    else {
      const byName = usStates.find(
        (s) => longNorm.length > 0 && s.name.toLowerCase() === longNorm.toLowerCase()
      );
      stateLabel = byName ? byName.label : longState || shortState;
    }
  }

  return {
    formattedAddress: formattedAddress || '',
    city,
    stateLabel,
    country,
    zip,
  };
}
