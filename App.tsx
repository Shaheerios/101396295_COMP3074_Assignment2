// App.tsx
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

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = await response.json();
      const rateRaw = json?.data?.[dest];

      if (typeof rateRaw !== 'number') {
        throw new Error('Rate not found in API response.');
      }

      setExchangeRate(rateRaw);

      const numericAmount = parseFloat(amount);
      const converted = numericAmount * rateRaw;
      setConvertedAmount(converted);
    } catch (err) {
      console.error('Conversion error:', err);
      setErrorMessage(
        'Failed to fetch exchange rate. Please check your API key, currencies, or network connection.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertPress = () => {
    performConversion();
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
            style={styles.input}
            value={baseCurrency}
            onChangeText={text => setBaseCurrency(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={3}
            placeholder="CAD"
            placeholderTextColor="#B0B3BA"
          />

          <Text style={styles.label}>
            Destination Currency Code (e.g., USD)
          </Text>
          <TextInput
            style={styles.input}
            value={destinationCurrency}
            onChangeText={text => setDestinationCurrency(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={3}
            placeholder="USD"
            placeholderTextColor="#B0B3BA"
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="100"
            placeholderTextColor="#B0B3BA"
          />

          <PrimaryButton
            title={isLoading ? 'Converting…' : 'Convert'}
            onPress={handleConvertPress}
            disabled={isLoading}
          />

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Fetching latest rate…</Text>
            </View>
          )}

          {errorMessage && (
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

          <Text style={styles.text}>Developer: Shaheer Ansari</Text>
          <Text style={styles.text}>Student ID: 101396295</Text>
          <Text style={styles.text}>
            Course: COMP3074 – Mobile Application Development
          </Text>
          <Text style={styles.text}>
            Assignment: A2 – Currency Converter App
          </Text>

          <Text style={[styles.text, { marginTop: 16 }]}>
            With this app, you can quickly convert money from one currency to
            another using live exchange rates powered by FreecurrencyAPI.
          </Text>
          <Text style={styles.text}>
            Just enter the amount and the three-letter currency codes, and the
            app will check everything for you, fetch the latest rate, and show
            both the exchange rate and your converted amount.
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
    backgroundColor: '#F1F3F8',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
});
