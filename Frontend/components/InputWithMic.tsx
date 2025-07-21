import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InputWithMic({
  placeholder,
  voicePrompt,
  value,
  onChange,
  keyboardType = 'default',
}: {
  placeholder: string;
  voicePrompt: string;
  value: string;
  onChange: (t: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChange}
        onFocus={() => console.log('Voice prompt:', voicePrompt)}
        keyboardType={keyboardType}
      />
      <TouchableOpacity style={styles.mic} onPress={() => console.log('Mic pressed')}>
        <Ionicons name="mic-outline" size={24} color="#444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#000',
  },
  mic: {
    padding: 8,
  },
});
