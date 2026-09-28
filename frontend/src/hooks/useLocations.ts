import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface LocationData {
  id: number;
  state_id: string;
  state_name: string;
  district_id: string;
  district_name: string;
}

export function useLocations() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('locations')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) {
          setLocations(data);
        }
        setLoading(false);
      });
  }, []);

  const states = Array.from(new Map(locations.map(loc => [loc.state_id, { id: loc.state_id, name: loc.state_name }])).values());

  const getDistricts = (stateId: string) => {
    return locations.filter(loc => loc.state_id === stateId).map(loc => ({ id: loc.district_id, name: loc.district_name }));
  };

  return { locations, states, getDistricts, loading };
}
