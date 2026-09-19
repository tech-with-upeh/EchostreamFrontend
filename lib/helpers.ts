import countries from "i18n-iso-countries";
import ISO6391 from "iso-639-1";

type VoiceInfo = {
  languageCode: string;
  language: string;
  countryCode: string;
  country: string;
  name: string;
  description: string;
};

export function parseLocale(localeCode: string) {
  const [lang, region] = localeCode.split("-");

  return {
    language: ISO6391.getName(lang) || "Unknown Language",
    country: countries.getName(region, "en") || "Unknown Region",
  };
}

export const deriveVoiceInfo = (voiceId: string): VoiceInfo => {
  const [languageCode, countryCode, voiceName, description] =
    voiceId.split("-");

  const languages: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
  };

  const countries: Record<string, string> = {
    US: "USA",
    GB: "UK",
    CA: "Canada",
    AU: "Australia",
    NG: "Nigeria",
  };

  const descriptions: Record<string, string> = {
    Neural: "Neural",
    Multilingual: "Multilingual",
  };

  return {
    languageCode,
    language: languages[languageCode] ?? languageCode,
    countryCode,
    country: countries[countryCode] ?? countryCode,
    name: voiceName,
    description: descriptions[description] ?? description,
  };
};
