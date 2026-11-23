import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing } from '@/theme';

const goalLabels: Record<string, string> = {
  build_muscle: 'Build muscle',
  lose_fat: 'Lose fat',
  get_stronger: 'Get stronger',
  improve_fitness: 'Feel fitter',
};

const levelLabels: Record<string, string> = {
  beginner: 'New to training',
  intermediate: 'Some experience',
  advanced: 'Experienced',
};

export default function ProfileScreen() {
  const { session, profile, previewMode } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const signOut = async () => {
    if (previewMode) return;
    setBusy(true);
    const { error: signOutError } = await supabase.auth.signOut();
    setBusy(false);
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    router.replace('/sign-in');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.identity}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{profile?.full_name.slice(0, 1).toUpperCase() || 'A'}</Text></View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{profile?.full_name || 'APEX athlete'}</Text>
            <Text style={styles.email}>{previewMode ? 'Sample data · stored locally' : session?.user.email}</Text>
          </View>
          <View style={styles.verified}><Text style={styles.verifiedText}>ACTIVE</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Training profile</Text>
        <View style={styles.details}>
          <Detail label="Primary focus" value={profile?.primary_goal ? goalLabels[profile.primary_goal] : 'Not set'} />
          <View style={styles.divider} />
          <Detail label="Experience" value={profile?.experience_level ? levelLabels[profile.experience_level] : 'Not set'} />
          <View style={styles.divider} />
          <Detail label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Today'} />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteHeading}>{previewMode ? 'Local preview is active.' : 'Your data stays yours.'}</Text>
          <Text style={styles.noteBody}>{previewMode ? 'Demo workouts are stored only in this browser. Add Supabase keys and turn preview mode off to use a real account.' : 'Your profile is private to your account and protected by database access policies.'}</Text>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {previewMode ? (
          <PrimaryButton label="Local preview active" onPress={signOut} disabled secondary />
        ) : (
          <PrimaryButton label="Sign out" onPress={signOut} loading={busy} secondary />
        )}
        <Text style={styles.version}>APEX · PHASE 04</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 30 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 7 },
  identity: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: 25 },
  avatar: { width: 48, height: 48, borderRadius: radii.pill, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  identityCopy: { flex: 1, marginLeft: 12 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  email: { color: colors.muted, fontSize: 12, marginTop: 4 },
  verified: { borderRadius: radii.pill, backgroundColor: colors.accentDim, paddingHorizontal: 8, paddingVertical: 5 },
  verifiedText: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 0 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 29, marginBottom: 12 },
  details: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  detailRow: { minHeight: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  detailLabel: { color: colors.muted, fontSize: 13 },
  detailValue: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  divider: { height: 1, backgroundColor: colors.border },
  note: { marginTop: 20, marginBottom: 22, padding: spacing.md, borderLeftWidth: 2, borderLeftColor: colors.accent, backgroundColor: colors.surface },
  noteHeading: { color: colors.text, fontSize: 13, fontWeight: '700' },
  noteBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  version: { color: '#687067', fontSize: 9, fontWeight: '700', letterSpacing: 0, textAlign: 'center', marginTop: 25 },
});
