import type { CustomStyles } from 'local-first-auth'

/**
 * Shared theme for the local-first-auth and local-first-auth-import-export
 * components. Both packages accept the same CustomStyles shape, so onboarding
 * and import/export render identically. Values mirror client/src/index.css.
 */
export const authCustomStyles: CustomStyles = {
  primaryColor: '#C4973B', // brass
  backgroundColor: '#12243D', // navy-mid (card)
  textColor: '#F5F0E6', // cream
  inputBackgroundColor: '#0A1628', // navy
  inputTextColor: '#F5F0E6', // cream
  borderRadius: '12px',
  inputRadius: '8px',
  buttonRadius: '9999px', // matches .btn-primary (rounded-full)
}
