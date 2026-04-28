import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { AppTextInput } from "../../src/components/AppTextInput";
import { Screen } from "../../src/components/Screen";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { createIssue } from "../../src/features/issues/issueApi";
import type { IssueType } from "../../src/features/issues/issueTypes";

const issueTypes: Array<{ label: string; value: IssueType }> = [
  { label: "버그", value: "bug" },
  { label: "개선 요청", value: "improvement" },
  { label: "기능 요청", value: "feature" },
];

export default function SettingsIssuesScreen() {
  const auth = useAuth();
  const [issueType, setIssueType] = useState<IssueType>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (title.trim().length < 2 || body.trim().length < 5) {
      Alert.alert("제목은 2자 이상, 내용은 5자 이상 입력해 주세요.");
      return;
    }

    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createIssue({
        userId: auth.user.id,
        issueType,
        title,
        body,
      });
      Alert.alert("전송 완료", "요청이 저장되었습니다.");
      setTitle("");
      setBody("");
    } catch (error) {
      Alert.alert(
        "전송 실패",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.form}>
        <View style={styles.segment}>
          {issueTypes.map((item) => (
            <AppButton
              key={item.value}
              label={item.label}
              variant={issueType === item.value ? "primary" : "secondary"}
              onPress={() => setIssueType(item.value)}
            />
          ))}
        </View>
        <AppTextInput placeholder="제목" value={title} onChangeText={setTitle} />
        <AppTextInput
          multiline
          placeholder="내용"
          style={styles.body}
          value={body}
          onChangeText={setBody}
        />
        <AppText>선택한 종류: {issueType}</AppText>
        <AppButton
          disabled={isSubmitting}
          label={isSubmitting ? "보내는 중..." : "보내기"}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    minHeight: 140,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  form: {
    gap: 12,
  },
  segment: {
    flexDirection: "row",
    gap: 8,
  },
});
