import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing } from '@/theme';

export default function SignInScreen() {
  const { configured } = useAuth();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setMessage('');
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    if (creatingAccount && !fullName.trim()) {
      setError('Add your name to create an account.');
      return;
    }

    setBusy(true);
    try {
      if (creatingAccount) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          router.replace('/');
        } else {
          setMessage('Check your email to confirm your account, then sign in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        router.replace('/');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandLine}>
          <View style={styles.brandMark}><Text style={styles.markText}>A</Text></View>
          <Text style={styles.wordmark}>APEX<Text style={styles.wordmarkDot}>.</Text></Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>YOUR TRAINING, IN FOCUS</Text>
          <Text style={styles.title}>{creatingAccount ? 'Build your baseline.' : 'Make progress personal.'}</Text>
          <Text style={styles.subtitle}>A clear place to start. Your training story, built one day at a time.</Text>
        </View>

        {!configured ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Supabase setup needed</Text>
            <Text style={styles.noticeBody}>Add your project URL and anon key to a local .env file, then restart Expo to enable accounts.</Text>
          </View>
        ) : (
          <View style={styles.form}>
            {creatingAccount && <TextField label="Name" value={fullName} onChangeText={setFullName} placeholder="Your name" autoCapitalize="words" />}
            <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" textContentType="emailAddress" />
            <TextField label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry textContentType={creatingAccount ? 'newPassword' : 'password'} />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {message ? <Text accessibilityRole="text" style={styles.success}>{message}</Text> : null}
            <PrimaryButton label={creatingAccount ? 'Create account' : 'Sign in'} onPress={submit} loading={busy} />
            <Pressable onPress={() => { setCreatingAccount(!creatingAccount); setError(''); setMessage(''); }} style={styles.switch}>
              <Text style={styles.switchText}>{creatingAccount ? 'Already have an account? ' : 'New to APEX? '}<Text style={styles.switchAction}>{creatingAccount ? 'Sign in' : 'Create account'}</Text></Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.footer}>STRONGER, WITH INTENTION.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 26, paddingBottom: 24, justifyContent: 'space-between' },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.background, fontSize: 18, fontWeight: '900' },
  wordmark: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: 0 },
  wordmarkDot: { color: colors.accent },
  intro: { marginTop: 62, marginBottom: 30 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0, marginBottom: 14 },
  title: { color: colors.text, fontSize: 42, lineHeight: 46, fontWeight: '800', letterSpacing: 0 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 16, maxWidth: 330 },
  form: { gap: spacing.md, marginBottom: 36 },
  notice: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: 36, gap: spacing.sm },
  noticeTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  noticeBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  success: { color: colors.accent, fontSize: 13, lineHeight: 19 },
  switch: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: colors.muted, fontSize: 13 },
  switchAction: { color: colors.accent, fontWeight: '700' },
  footer: { alignSelf: 'center', color: '#687067', fontSize: 10, fontWeight: '700', letterSpacing: 0 },
});
