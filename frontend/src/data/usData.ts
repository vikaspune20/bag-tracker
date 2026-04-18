import { City, State } from 'country-state-city';
import airportsRaw from 'airports/airports.json';

type AirportRecord = {
  iata?: string;
  iso?: string;
  status?: number;
  type?: string;
  name?: string;
};

const usStatesRaw = State.getStatesOfCountry('US');

export const usStates = usStatesRaw
  .map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
    label: `${s.name} (${s.isoCode})`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const usCitiesByStateLabel = Object.fromEntries(
  usStates.map((s) => {
    const cities = City.getCitiesOfState('US', s.isoCode)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));
    return [s.label, cities];
  })
);

export const allUsCities = Array.from(
  new Set(
    Object.values(usCitiesByStateLabel)
      .flat()
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b));

export const usAirportOptions = (airportsRaw as AirportRecord[])
  .filter((a) => a.iso === 'US' && a.status === 1 && a.type === 'airport' && a.iata && a.name)
  .map((a) => `${a.iata} - ${a.name}`)
  .sort((a, b) => a.localeCompare(b));
