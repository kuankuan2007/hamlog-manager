import { callsign2EmailModes, type Callsign2EmailMode,type Callsign2EmailResponse } from '@/api/schema';
import { getData } from '@/api/util';

export async function callsign2email(callsign: string, mode: Callsign2EmailMode){
  if(!callsign2EmailModes.includes(mode)) {
    return Promise.reject(new Error(`Invalid mode: ${mode}. Must be one of: ${callsign2EmailModes.join(', ')}`));
  }
  const params = new URLSearchParams({ callsign, mode });
  return await getData<Callsign2EmailResponse>(
    fetch(`/api/auto/callsign2email?${params.toString()}`)
  );
}
