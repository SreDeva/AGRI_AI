import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import LeaseCard from '../../components/LeaseCard';
import axios from 'axios';

type Lease = {
  _id: string;
  area: string;
  location: string;
  leaseRate: number;
  contact: string;  // Still fetched, but not shown
};

export default function LeaseList() {
  const [leases, setLeases] = useState<Lease[]>([]);

  const fetchLeases = async () => {
    const res = await axios.get('http://localhost:8081/leases');
    setLeases(res.data);
  };

  useEffect(() => { fetchLeases(); }, []);

  const onCall = (contact: string) => () => {
    Linking.openURL(`tel:${contact}`).catch(() => Alert.alert('Error', 'Cannot make a call'));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {leases.map(l => (
        <LeaseCard
          key={l._id}
          id={l._id}
          area={l.area}
          location={l.location}
          leaseRate={l.leaseRate}
          onCall={onCall(l.contact)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { padding: 16 } });