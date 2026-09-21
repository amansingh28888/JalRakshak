import React, { useState } from 'react';
import { LANGUAGES, getLanguageByCode } from '../utils/language';

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string, name: string) => void;
  disabled?: boolean;
}

function GlobeAltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, disabled }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customLanguage, setCustomLanguage] = useState('');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const lang = getLanguageByCode(val);
      onChange(lang.code, lang.name);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customLanguage.trim()) {
      onChange(customLanguage.trim().toLowerCase().substring(0, 5), customLanguage.trim());
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <GlobeAltIcon className="h-5 w-5 text-gray-500" />
      
      {!isCustom ? (
        <select
          value={value}
          onChange={handleSelectChange}
          disabled={disabled}
          className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.nativeName})
            </option>
          ))}
          <option value="custom">Other (Custom)...</option>
        </select>
      ) : (
        <form onSubmit={handleCustomSubmit} className="flex flex-1 items-center space-x-2">
          <input
            type="text"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            placeholder="Type language..."
            disabled={disabled}
            className="form-input block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            autoFocus
          />
          <button
            type="submit"
            disabled={disabled || !customLanguage.trim()}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              setCustomLanguage('');
            }}
            disabled={disabled}
            className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
