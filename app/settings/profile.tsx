import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { AppTextInput } from "../../src/components/AppTextInput";
import { Screen } from "../../src/components/Screen";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { getProfile, updateProfile } from "../../src/features/profile/profileApi";
import { isSupabaseConfigured } from "../../src/lib/supabase";

export default function ProfileScreen() {
  const auth = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user || !isSupabaseConfigured) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    getProfile(auth.user.id)
      .then((profile) => {
        setDisplayName(profile.displayName ?? "");
        setAvatarUrl(profile.avatarUrl ?? "");
        setBio(profile.bio ?? "");
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [auth.user]);

  async function handleSave() {
    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert("Supabase 설정이 필요합니다.");
      return;
    }

    try {
      setIsSaving(true);
      const profile = await updateProfile(auth.user.id, {
        displayName,
        avatarUrl,
        bio,
      });
      setDisplayName(profile.displayName ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
      setBio(profile.bio ?? "");
      Alert.alert("저장되었습니다.");
    } catch (error) {
      Alert.alert(
        "프로필 저장 실패",
        error instanceof Error ? error.message : "프로필을 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.form}>
        {isLoading ? (
          <AppText style={styles.statusText}>불러오는 중...</AppText>
        ) : errorMessage ? (
          <AppText style={[styles.statusText, styles.errorText]}>{errorMessage}</AppText>
        ) : null}

        <AppTextInput
          placeholder="이름"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!isSaving}
        />
        <AppTextInput
          placeholder="프로필 사진 URL"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          editable={!isSaving}
        />
        <AppTextInput
          placeholder="한줄소개"
          value={bio}
          onChangeText={setBio}
          editable={!isSaving}
        />
        <AppButton
          label={isSaving ? "저장 중..." : "저장"}
          onPress={handleSave}
          disabled={isSaving || isLoading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  statusText: {
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "#ff4444",
  },
});
