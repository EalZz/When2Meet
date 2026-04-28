import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppTextInput } from "../../src/components/AppTextInput";
import { Screen } from "../../src/components/Screen";

export default function ProfileScreen() {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  function handleSave() {
    Alert.alert("저장 준비", "Supabase 연결 후 프로필이 저장됩니다.");
  }

  return (
    <Screen>
      <View style={styles.form}>
        <AppTextInput placeholder="이름" value={displayName} onChangeText={setDisplayName} />
        <AppTextInput
          placeholder="프로필 사진 URL"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
        />
        <AppTextInput placeholder="한줄소개" value={bio} onChangeText={setBio} />
        <AppButton label="저장" onPress={handleSave} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
