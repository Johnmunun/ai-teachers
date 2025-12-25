'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Coins,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  RefreshCw,
  TrendingUp,
  ArrowRightLeft
} from 'lucide-react';
import { 
  currencies, 
  CurrencyCode, 
  formatMoney, 
  defaultExchangeRates,
  convertCurrency,
  getStoredExchangeRates,
  saveExchangeRates
} from '@/lib/currency';

type TabType = 'general' | 'currency' | 'rates' | 'notifications' | 'appearance' | 'security';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    // General
    language: 'fr',
    timezone: 'Africa/Douala',
    
    // Currency
    currency: 'USD' as CurrencyCode,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    sessionReminders: true,
    paymentAlerts: true,
    
    // Appearance
    theme: 'dark',
    animations: true,
    soundEffects: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30
  });

  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number>>({
    ...defaultExchangeRates
  });

  // Conversion preview
  const [conversionAmount, setConversionAmount] = useState(100);
  const [conversionFrom, setConversionFrom] = useState<CurrencyCode>('USD');
  const [conversionTo, setConversionTo] = useState<CurrencyCode>('EUR');

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('codinglive_settings');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    // Load exchange rates
    const storedRates = getStoredExchangeRates();
    if (Object.keys(storedRates).length > 0) {
      setExchangeRates(prev => ({ ...prev, ...storedRates }));
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Save settings
      localStorage.setItem('codinglive_settings', JSON.stringify(settings));
      
      // Dispatch custom event to notify other components of currency change
      window.dispatchEvent(new CustomEvent('currencyChanged'));
      
      // Save exchange rates
      saveExchangeRates(exchangeRates);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const resetRates = () => {
    setExchangeRates({ ...defaultExchangeRates });
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Globe },
    { id: 'currency', label: 'Devise', icon: Coins },
    { id: 'rates', label: 'Taux de change', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-400" />
          Paramètres
        </h1>
        <p className="text-slate-400">Configurez votre expérience CodingLive</p>
      </div>

      {/* Success/Error Messages */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">Paramètres sauvegardés avec succès !</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass rounded-2xl p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-cyan-400' : ''}`} />
                <span className="font-medium">{tab.label}</span>
                <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                  activeTab === tab.id ? 'rotate-90' : ''
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="glass rounded-2xl p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Paramètres généraux
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Langue</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Fuseau horaire</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="Africa/Douala">Afrique/Douala (GMT+1)</option>
                      <option value="Africa/Lagos">Afrique/Lagos (GMT+1)</option>
                      <option value="Africa/Dakar">Afrique/Dakar (GMT+0)</option>
                      <option value="Africa/Casablanca">Afrique/Casablanca (GMT+1)</option>
                      <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                      <option value="America/New_York">Amérique/New York (GMT-5)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Currency Settings */}
            {activeTab === 'currency' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-cyan-400" />
                  Devise principale
                </h2>

                <p className="text-slate-400 text-sm mb-4">
                  Sélectionnez la devise utilisée pour afficher les montants des paiements.
                </p>

                <div className="grid gap-3">
                  {Object.entries(currencies).map(([code, currency]) => (
                    <button
                      key={code}
                      onClick={() => setSettings({ ...settings, currency: code as CurrencyCode })}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        settings.currency === code
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                          settings.currency === code
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-white/10 text-slate-400'
                        }`}>
                          {currency.symbol}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{currency.name}</div>
                          <div className="text-sm text-slate-500">
                            1 EUR = {exchangeRates[code as CurrencyCode]} {currency.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Exemple:</div>
                        <div className="font-mono">{formatMoney(150000, code as CurrencyCode)}</div>
                      </div>
                      {settings.currency === code && (
                        <CheckCircle2 className="w-6 h-6 text-cyan-400 ml-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Exchange Rates Settings */}
            {activeTab === 'rates' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    Taux de change
                  </h2>
                  <button
                    onClick={resetRates}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>

                <p className="text-slate-400 text-sm">
                  Configurez les taux de change par rapport à l'Euro (EUR). Ces taux sont utilisés pour les conversions.
                </p>

                {/* Rates Grid */}
                <div className="grid gap-4">
                  {Object.entries(currencies).map(([code, currency]) => (
                    <div
                      key={code}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-lg font-bold text-white">
                        {currency.symbol}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{currency.name}</div>
                        <div className="text-sm text-slate-500">{code}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">1 EUR =</span>
                        <input
                          type="number"
                          step="0.01"
                          value={exchangeRates[code as CurrencyCode]}
                          onChange={(e) => setExchangeRates({
                            ...exchangeRates,
                            [code]: parseFloat(e.target.value) || 0
                          })}
                          disabled={code === 'EUR'}
                          className={`w-32 px-3 py-2 rounded-lg text-right font-mono ${
                            code === 'EUR'
                              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                              : 'bg-white/10 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50'
                          }`}
                        />
                        <span className="text-white font-medium w-16">{currency.symbol}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conversion Preview */}
                <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
                    Aperçu de conversion
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Montant</label>
                      <input
                        type="number"
                        value={conversionAmount}
                        onChange={(e) => setConversionAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">De</label>
                      <select
                        value={conversionFrom}
                        onChange={(e) => setConversionFrom(e.target.value as CurrencyCode)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        {Object.entries(currencies).map(([code, curr]) => (
                          <option key={code} value={code}>{curr.symbol} - {curr.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Vers</label>
                      <select
                        value={conversionTo}
                        onChange={(e) => setConversionTo(e.target.value as CurrencyCode)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        {Object.entries(currencies).map(([code, curr]) => (
                          <option key={code} value={code}>{curr.symbol} - {curr.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-white/5 text-center">
                    <div className="text-slate-400 mb-1">Résultat</div>
                    <div className="text-3xl font-bold text-white">
                      {formatMoney(conversionAmount, conversionFrom)}
                      <span className="mx-4 text-cyan-400">=</span>
                      {formatMoney(
                        convertCurrency(conversionAmount, conversionFrom, conversionTo, exchangeRates),
                        conversionTo
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-2">
                      Taux: 1 {currencies[conversionFrom].symbol} = {(exchangeRates[conversionTo] / exchangeRates[conversionFrom]).toFixed(4)} {currencies[conversionTo].symbol}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Notifications
                </h2>

                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Notifications par email', desc: 'Recevez des emails pour les événements importants' },
                    { key: 'pushNotifications', label: 'Notifications push', desc: 'Notifications dans le navigateur' },
                    { key: 'sessionReminders', label: 'Rappels de session', desc: 'Rappel 15 minutes avant le début d\'un cours' },
                    { key: 'paymentAlerts', label: 'Alertes de paiement', desc: 'Notifications pour les échéances de paiement' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-sm text-slate-500">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings[item.key as keyof typeof settings] 
                            ? 'bg-cyan-500' 
                            : 'bg-white/20'
                        }`}
                      >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                          settings[item.key as keyof typeof settings] 
                            ? 'translate-x-7' 
                            : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-cyan-400" />
                  Apparence
                </h2>

                {/* Theme */}
                <div>
                  <label className="block text-sm text-slate-400 mb-3">Thème</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSettings({ ...settings, theme: 'dark' })}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        settings.theme === 'dark'
                          ? 'bg-cyan-500/10 border-cyan-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Moon className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <div className="text-left">
                        <div className="font-medium text-white">Sombre</div>
                        <div className="text-xs text-slate-500">Mode nuit</div>
                      </div>
                      {settings.theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-cyan-400 ml-auto" />}
                    </button>
                    <button
                      onClick={() => setSettings({ ...settings, theme: 'light' })}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        settings.theme === 'light'
                          ? 'bg-cyan-500/10 border-cyan-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Sun className={`w-6 h-6 ${settings.theme === 'light' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <div className="text-left">
                        <div className="font-medium text-white">Clair</div>
                        <div className="text-xs text-slate-500">Mode jour</div>
                      </div>
                      {settings.theme === 'light' && <CheckCircle2 className="w-5 h-5 text-cyan-400 ml-auto" />}
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">Animations</div>
                        <div className="text-sm text-slate-500">Effets visuels et transitions</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, animations: !settings.animations })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.animations ? 'bg-violet-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        settings.animations ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        {settings.soundEffects ? (
                          <Volume2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">Effets sonores</div>
                        <div className="text-sm text-slate-500">Sons de notification et d'interaction</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, soundEffects: !settings.soundEffects })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.soundEffects ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        settings.soundEffects ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Sécurité
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="font-medium text-white">Authentification à deux facteurs</div>
                      <div className="text-sm text-slate-500">Ajouter une couche de sécurité supplémentaire</div>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.twoFactorAuth ? 'bg-cyan-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        settings.twoFactorAuth ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Expiration de la session (minutes)
                    </label>
                    <select
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 heure</option>
                      <option value={120}>2 heures</option>
                      <option value={480}>8 heures</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <button className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-all">
                      Déconnecter tous les appareils
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
