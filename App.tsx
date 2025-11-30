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
} from 'react-native';

const Stack = createNativeStackNavigator();

function MainScreen({ navigation }: any) {
  const [baseCurrency, setBaseCurrency] = React.useState('CAD');
  const [destinationCurrency, setDestinationCurrency] = React.useState('USD');
  const [amount, setAmount] = React.useState('1');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null); // to confirm success in M2

  const validateInputs = (): boolean => {
    setErrorMessage(null);
    setStatusMessage(null);

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

  const handleConvertPress = () => {
    if (!validateInputs()) {
      return;
    }
    // M2: no API yet – just confirm validation passed
    setStatusMessage('Inputs look valid. (API call will be added next.)');
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
        placeholder="1"
      />

      <View style={styles.buttonContainer}>
        <Button title="Convert" onPress={handleConvertPress} />
      </View>

      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {statusMessage && !errorMessage && (
        <Text style={styles.statusText}>{statusMessage}</Text>
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
  errorText: {
    color: 'red',
    marginTop: 12,
    fontSize: 14,
  },
  statusText: {
    color: 'green',
    marginTop: 12,
    fontSize: 14,
  },
});
