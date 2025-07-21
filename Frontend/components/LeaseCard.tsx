import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

type Props = {
  id: string;
  area: string;
  location: string;
  leaseRate: number;
  onCall: () => void;
  onRemove?: (id: string) => void;
};

export default function LeaseCard({ id, area, location, leaseRate, onCall, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{area} | {location}</Text>
      <Text>Rate: ₹{leaseRate}</Text>
      <View style={styles.buttons}>
        <Button title="📞 Call" onPress={onCall} />
        {onRemove && <Button title="❌ Remove" color="red" onPress={() => onRemove(id)} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#eef8f2',
    borderRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
