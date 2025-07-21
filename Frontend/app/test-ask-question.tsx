import React from 'react';
import { View, StyleSheet } from 'react-native';
import AskQuestion from '../components/AskQuestion';

export default function TestAskQuestion() {
  return (
    <View style={styles.container}>
      <AskQuestion />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
});
