// App.tsx
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';

const Stack = createNativeStackNavigator();

const FREECURRENCY_API_KEY = 'fca_live_4zD7feaWtrcqtd9P5Dol8nhARlpSo4xxDX4zG5Ci';

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
    // 🔁 Now calls the real API, not just a status message
    performConversion();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Currency Converter</Text>

      <Text style={styles.label}>Base Currency Code (e.g., CAD)</Text>
      <TextInput
        style={styles.input}
        value={baseCurrency}
        onChangeText={text => setBaseCurrency(text.toUpperCase())}
        autoCapitalize="characters"
        maxLength={3}
        placeholder="CAD"
      />

      <Text style={styles.label}>Destination Currency Code (e.g., USD)</Text>
      <TextInput
        style={styles.input}
        value={destinationCurrency}
        onChangeText={text => setDestinationCurrency(text.toUpperCase())}
        autoCapitalize="characters"
        maxLength={3}
        placeholder="USD"
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="100"
      />

      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? 'Converting...' : 'Convert'}
          onPress={handleConvertPress}
          disabled={isLoading}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Converting...</Text>
        </View>
      )}

      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {!errorMessage && exchangeRate !== null && convertedAmount !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {amount} {baseCurrency.toUpperCase()} ={' '}
            {convertedAmount.toFixed(2)} {destinationCurrency.toUpperCase()}
          </Text>
          <Text style={styles.resultSubText}>
            Exchange rate: 1 {baseCurrency.toUpperCase()} ={' '}
            {exchangeRate.toFixed(4)} {destinationCurrency.toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.aboutButtonContainer}>
        <Button
          title="Go to About Screen"
          onPress={() => navigation.navigate('About')}
        />
      </View>
    </View>
  );
}

function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About This App</Text>
      <Text style={styles.text}>
        (Later we will put Shaheer&apos;s full name and student ID here.)
      </Text>
      <Text style={styles.text}>
        This app converts amounts between currencies using a live exchange rate API.
      </Text>
    </View>
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
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
  aboutButtonContainer: {
    marginTop: 24,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginTop: 12,
    fontSize: 14,
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSubText: {
    fontSize: 14,
  },
});
