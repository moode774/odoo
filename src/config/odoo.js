export const STORAGE_KEY = 'odoo_tenant_config';

// Load from local storage
export const loadConfig = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

// Save to local storage
export const saveConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

// Clear config
export const clearConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// Default empty config if never setup
export const ODOO_CONFIG = loadConfig() || {
  baseUrl:      '/odoo',
  db:           'forestedge-staging-28935052',
  serviceEmail: 'mohammed.abdulsalam@af.sa',
  apiKey:       '@sIIOTwrkAfr8ZjG',
};

export const updateLiveConfig = () => {
  const latest = loadConfig();
  if (latest) {
    Object.assign(ODOO_CONFIG, latest);
  }
};
