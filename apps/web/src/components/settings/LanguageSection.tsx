import {
  useI18n,
  SUPPORTED_LOCALES,
  LOCALE_NATIVE_NAMES,
  type SupportedLocale,
} from '../../lib/i18n';
import { useAccessibility } from '../accessibility';

export function LanguageSection() {
  const { locale, setLocale, isRtl } = useI18n();
  const { announce } = useAccessibility();

  return (
    <section
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-labelledby="language-settings-heading"
    >
      <div>
        <h2 id="language-settings-heading" className="text-lg font-semibold text-gray-900">
          Language
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Choose your preferred language. The app will update all text immediately.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-700">
          Display Language
        </label>
        <select
          id="language-select"
          value={locale}
          onChange={(e) => {
            const next = e.target.value as SupportedLocale;
            if (SUPPORTED_LOCALES.includes(next)) {
              setLocale(next);
              announce(`Language changed to ${LOCALE_NATIVE_NAMES[next]}`);
            }
          }}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <option key={loc} value={loc}>
              {LOCALE_NATIVE_NAMES[loc]}
            </option>
          ))}
        </select>
      </div>

      {isRtl && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Right-to-Left Layout Active</p>
          <p className="mt-1">
            The interface direction has been switched to right-to-left for this language.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">Translation Coverage</p>
        <p className="mt-1">
          10 languages are supported. Text that has not yet been translated will fall back to
          English automatically.
        </p>
      </div>
    </section>
  );
}
