import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import InputWithMic from '../components/InputWithMic';

// Mock function — replace with your real API call
async function submitHouseholdDetails(data: any): Promise<void> {
  console.log('Submitting household data:', data);
}

export default function HouseholdOnboard() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const router = useRouter();

  const [gardenType, setGardenType] = useState('');
  const [plants, setPlants] = useState('');
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('');

  const submitDisabled = !gardenType || !plants || !gender || !language;

  const submit = async () => {
    if (submitDisabled) return;
    await submitHouseholdDetails({ phone, gardenType, plants, gender, language });
    router.replace('/(tabs)/household-app');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Household Setup</Text>

      <InputWithMic
        placeholder="Garden Type (Terrace/Pots/Backyard)"
        voicePrompt="Tell us your garden type: terrace, pots, or backyard"
        value={gardenType}
        onChange={setGardenType}
      />

      <InputWithMic
        placeholder="Plants Usually Grown"
        voicePrompt="Which plants do you usually grow?"
        value={plants}
        onChange={setPlants}
      />

      <InputWithMic
        placeholder="Gender"
        voicePrompt="What is your gender?"
        value={gender}
        onChange={setGender}
      />

      <InputWithMic
        placeholder="Language Preference"
        voicePrompt="Which language do you prefer?"
        value={language}
        onChange={setLanguage}
      />

      <TouchableOpacity
        style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
        onPress={submit}
        disabled={submitDisabled}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#F3F9F7',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2F6D3E',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2F6D3E',
    padding: 18,
    borderRadius: 10,
    marginTop: 25,
    width: '60%',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#8DBB8B',
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
  },
});
