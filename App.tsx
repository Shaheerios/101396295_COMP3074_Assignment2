import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const Stack = createNativeStackNavigator();

// 🔑 Shaheer's FreecurrencyAPI key
const FREECURRENCY_API_KEY = 'fca_live_4zD7feaWtrcqtd9P5Dol8nhARlpSo4xxDX4zG5Ci';

const APP_VERSION = '1.0.0';

// Type for recent conversion history entries
type ConversionRecord = {
  id: number;
  base: string;
  dest: string;
  amount: number;
  converted: number;
  rate: number;
  timestamp: string;
};

// Reusable primary button
function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

// Reusable secondary button
function SecondaryButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function MainScreen({ navigation }: any) {
  const [baseCurrency, setBaseCurrency] = React.useState('CAD');
  const [destinationCurrency, setDestinationCurrency] = React.useState('USD');
  const [amount, setAmount] = React.useState('100');

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [exchangeRate, setExchangeRate] = React.useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = React.useState<number | null>(
    null,
  );

  // Keep track of the last few successful conversions
  const [recentConversions, setRecentConversions] = React.useState<
    ConversionRecord[]
  >([]);

  // Simple detection of which field caused the validation error
  const isBaseInvalid = !!errorMessage?.startsWith('Base currency');
  const isDestInvalid = !!errorMessage?.startsWith('Destination currency');
  const isAmountInvalid = !!errorMessage?.startsWith('Amount');

  const validateInputs = (): boolean => {
    setErrorMessage(null);

    const currencyRegex = /^[A-Z]{3}$/;

    if (!currencyRegex.test(baseCurrency.trim())) {
      setErrorMessage(
        'Base currency must be exactly 3 uppercase letters (e.g., CAD).',
      );
      return false;
    }

    if (!currencyRegex.test(destinationCurrency.trim())) {
      setErrorMessage(
        'Destination currency must be exactly 3 uppercase letters (e.g., USD).',
      );
      return false;
    }

    const numericAmount = parseFloat(amount);

    if (!amount || Number.isNaN(numericAmount)) {
      setErrorMessage('Amount must be a valid number.');
      return false;
    }

    if (numericAmount <= 0) {
      setErrorMessage('Amount must be a positive number.');
      return false;
    }

    return true;
  };

  const performConversion = async () => {
    if (!validateInputs()) return;

    setErrorMessage(null);
    setExchangeRate(null);
    setConvertedAmount(null);

    setIsLoading(true);

    try {
      const base = baseCurrency.trim().toUpperCase();
      const dest = destinationCurrency.trim().toUpperCase();

      const url =
        `https://api.freecurrencyapi.com/v1/latest` +
        `?apikey=${FREECURRENCY_API_KEY}` +
        `&base_currency=${base}` +
        `&currencies=${dest}`;

      console.log('Requesting:', url);

      const response = await fetch(url);
      const rawBody = await response.text();
      console.log(
        'FreeCurrencyAPI status:',
        response.status,
        'body:',
        rawBody,
      );

      if (!response.ok) {
        // Try to parse error JSON to get a better message
        try {
          const errorJson = JSON.parse(rawBody);
          const apiMessage =
            errorJson?.message ||
            errorJson?.error ||
            (Array.isArray(errorJson?.errors) ? errorJson.errors[0] : null);

          if (apiMessage) {
            throw new Error(`HTTP ${response.status}: ${apiMessage}`);
          }
        } catch {
          // ignore JSON parse errors, fall back to generic
        }
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = JSON.parse(rawBody);
      const rateRaw = json?.data?.[dest];

      if (typeof rateRaw !== 'number') {
        throw new Error('Rate not found in API response.');
      }

      setExchangeRate(rateRaw);

      const numericAmount = parseFloat(amount);
      const converted = numericAmount * rateRaw;
      setConvertedAmount(converted);

      // Save to recent history (keep only last 5)
      const now = new Date();
      const record: ConversionRecord = {
        id: now.getTime(),
        base,
        dest,
        amount: numericAmount,
        converted,
        rate: rateRaw,
        timestamp: now.toLocaleTimeString(),
      };

      setRecentConversions(prev => {
        const next = [record, ...prev];
        return next.slice(0, 5);
      });
    } catch (err: any) {
      console.error('Conversion error:', err);
      const msg = String(err?.message || '');

      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setErrorMessage(
          'The API key was rejected (401 Unauthorized). Please double-check the FreeCurrencyAPI key.',
        );
      } else if (
        msg.includes('422') ||
        msg.toLowerCase().includes('unprocessable')
      ) {
        setErrorMessage(
          'The currency API rejected this request (422). This can happen if the base/destination currency is not allowed for your plan or if the request format changed.',
        );
      } else if (msg.includes('429')) {
        setErrorMessage(
          'Rate limit reached on FreeCurrencyAPI (429). Please wait a bit and try again.',
        );
      } else {
        setErrorMessage(
          'Failed to fetch exchange rate. Please check your API key, currencies, or network connection.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertPress = () => {
    performConversion();
  };

  const handleClear = () => {
    setBaseCurrency('');
    setDestinationCurrency('');
    setAmount('');
    setExchangeRate(null);
    setConvertedAmount(null);
    setErrorMessage(null);
    // If you want to also clear history, uncomment:
    // setRecentConversions([]);
  };

  // Added - Recent Conversions 
  const handleClearHistory = () => {
    setRecentConversions([]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Currency Converter</Text>
          <Text style={styles.subtitle}>
            Enter the amount and currency codes to see the latest conversion.
          </Text>

          <Text style={styles.label}>Base Currency Code (e.g., CAD)</Text>
          <TextInput
            style={[styles.input, isBaseInvalid && styles.inputError]}
            value={baseCurrency}
            onChangeText={text => setBaseCurrency(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={3}
            placeholder="CAD"
            placeholderTextColor="#B0B3BA"
          />
          {isBaseInvalid && (
            <Text style={styles.fieldError}>
              Use a 3-letter code like CAD.
            </Text>
          )}

          <Text style={styles.label}>
            Destination Currency Code (e.g., USD)
          </Text>
          <TextInput
            style={[styles.input, isDestInvalid && styles.inputError]}
            value={destinationCurrency}
            onChangeText={text => setDestinationCurrency(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={3}
            placeholder="USD"
            placeholderTextColor="#B0B3BA"
          />
          {isDestInvalid && (
            <Text style={styles.fieldError}>
              Use a 3-letter code like USD.
            </Text>
          )}

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={[styles.input, isAmountInvalid && styles.inputError]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="100"
            placeholderTextColor="#B0B3BA"
          />
          {isAmountInvalid && (
            <Text style={styles.fieldError}>
              Enter a positive number greater than 0.
            </Text>
          )}

          <PrimaryButton
            title={isLoading ? 'Converting…' : 'Convert'}
            onPress={handleConvertPress}
            disabled={isLoading}
          />

          {/* NEW: Clear fields + clear history buttons in one row */}
          <View style={styles.clearButtonRow}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.8}
            >
              <Text style={styles.clearButtonText}>Clear Fields</Text>
            </TouchableOpacity>

            {/* NEW: Show Clear History only when there is some history */}
            {recentConversions.length > 0 && (
              <TouchableOpacity
                style={[styles.clearButton, { marginLeft: 8 }]}
                onPress={handleClearHistory}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>Clear History</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Fetching latest rate…</Text>
            </View>
          )}

          {errorMessage &&
            !isBaseInvalid &&
            !isDestInvalid &&
            !isAmountInvalid && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

          {!errorMessage && exchangeRate !== null && convertedAmount !== null && (
            <View style={styles.resultBox}>
              <Text style={styles.resultMain}>
                {amount} {baseCurrency.toUpperCase()} ={' '}
                {convertedAmount.toFixed(2)}{' '}
                {destinationCurrency.toUpperCase()}
              </Text>
              <Text style={styles.resultSub}>
                Exchange rate: 1 {baseCurrency.toUpperCase()} ={' '}
                {exchangeRate.toFixed(4)}{' '}
                {destinationCurrency.toUpperCase()}
              </Text>
            </View>
          )}

          {recentConversions.length > 0 && (
            <View style={styles.historyBox}>
              {/* NEW: Only title here; clear button moved next to Clear Fields */}
              <Text style={styles.historyTitle}>Recent Conversions</Text>

              {recentConversions.map(item => (
                <View key={item.id} style={styles.historyRow}>
                  <Text style={styles.historyMain}>
                    {item.amount} {item.base} →{' '}
                    {item.converted.toFixed(2)} {item.dest}
                  </Text>
                  <Text style={styles.historySub}>
                    1 {item.base} = {item.rate.toFixed(4)} {item.dest} ·{' '}
                    {item.timestamp}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <SecondaryButton
            title="Go to About Screen"
            onPress={() => navigation.navigate('About')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AboutScreen() {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>About This App</Text>

          <Text style={styles.text}>Developer: Shaheer Ansari & Jinah Ahn</Text>
          <Text style={styles.text}>Student ID: 101396295 & 100902591</Text>
          
          <Text style={styles.text}>
            Course: COMP3074 – Mobile Application Development
          </Text>
          <Text style={styles.text}>
            Assignment: A2 – Currency Converter App
          </Text>
          
          <Text style={styles.text}>App Version: {APP_VERSION}</Text>

          <Text style={[styles.text, { marginTop: 16 }]}>
            With this app, you can quickly convert money from one currency to
            another using live exchange rates powered by FreecurrencyAPI.
          </Text>
          <Text style={styles.text}>
            Just enter the amount and the three-letter currency codes, and the
            app will check everything for you, fetch the latest rate, and show
            both the exchange rate and your converted amount.
          </Text>
          <Text style={[styles.text, { textAlign: 'center', marginTop: 16 }]}>
            Thank you for using this app!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ title: 'Currency Converter' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ title: 'About' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E1F5FE',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginVertical: 24,   // Added this part
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    color: '#1A1C23',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6C727F',
  },
  text: {
    fontSize: 15,
    marginBottom: 8,
    color: '#2C2F3A',
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
    marginTop: 10,
    color: '#4A4E5C',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D4E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FAFBFF',
  },
  inputError: {
    borderColor: '#B00020',
    backgroundColor: '#FDEAEA',
  },
  fieldError: {
    fontSize: 12,
    color: '#B00020',
    marginTop: 2,
    marginBottom: 4,
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // NEW: row layout so Clear Fields & Clear History can sit side-by-side
  clearButtonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EFF2FB',
  },
  clearButtonText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '500',
  },
  secondaryButton: {
    marginTop: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1E88E5',
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1E88E5',
    fontSize: 15,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A4E5C',
  },
  errorBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FDEAEA',
    borderWidth: 1,
    borderColor: '#F5C2C7',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B00020',
    marginBottom: 4,
  },
  errorText: {
    color: '#B00020',
    fontSize: 14,
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E8F4FF',
    borderWidth: 1,
    borderColor: '#C2E0FF',
  },
  resultMain: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#123055',
  },
  resultSub: {
    fontSize: 14,
    color: '#34516F',
  },
  historyBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F6F7FB',
    borderWidth: 1,
    borderColor: '#E0E3EE',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2C2F3A',
  },
  historyRow: {
    marginBottom: 8,
  },
  historyMain: {
    fontSize: 14,
    fontWeight: '500',
    color: '#123055',
  },
  historySub: {
    fontSize: 12,
    color: '#6C727F',
  },
  helperText: {
    fontSize: 11,
    color: '#6C727F',
    marginBottom: 4,
  },
});
