export type WeatherReport = { place: string; temperature: number; code: number; rainChance?: number; forecastDate?: string; maxTemperature?: number; minTemperature?: number };
export async function getWeather(latitude: number, longitude: number, place: string, signal?: AbortSignal): Promise<WeatherReport> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=2&timezone=auto`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  const json = await response.json();
  if (typeof json?.current?.temperature_2m !== 'number' || typeof json?.current?.weather_code !== 'number') throw new Error('Weather response was incomplete');
  return { place, temperature: json.current.temperature_2m, code: json.current.weather_code, rainChance: json.daily?.precipitation_probability_max?.[0], forecastDate: json.daily?.time?.[0], maxTemperature: json.daily?.temperature_2m_max?.[0], minTemperature: json.daily?.temperature_2m_min?.[0] };
}

export async function getTomorrowWeather(latitude:number,longitude:number,place:string,signal?:AbortSignal):Promise<WeatherReport>{
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=2&timezone=auto`;
  const response=await fetch(url,{signal});
  if(!response.ok) throw new Error(`Weather service returned ${response.status}`);
  const json=await response.json(); const daily=json?.daily; const index=1;
  if(typeof daily?.weather_code?.[index]!=='number'||typeof daily?.temperature_2m_max?.[index]!=='number'||typeof daily?.temperature_2m_min?.[index]!=='number') throw new Error('Weather response was incomplete');
  return {place,temperature:daily.temperature_2m_max[index],code:daily.weather_code[index],rainChance:daily.precipitation_probability_max?.[index],forecastDate:daily.time?.[index],maxTemperature:daily.temperature_2m_max[index],minTemperature:daily.temperature_2m_min[index]};
}
