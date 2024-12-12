import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";

/**
 * SurveyScreen 컴포넌트
 * 운동 종료 후 산책로에 대한 만족도 조사를 수행하는 화면
 *
 * 데이터 흐름:
 * 1. EndScreen에서 route.params를 통해 운동 데이터 수신
 * 2. 사용자로부터 만족도 평가와 피드백을 수집
 * 3. 제출 버튼 클릭 시 데이터를 로깅하고 홈 화면으로 이동
 *
 * route.params로 전달받는 데이터:
 * - elapsedTime: 운동 시간 (초 단위)
 * - distance: 이동 거리 (km 단위)
 * - calories: 소모 칼로리 (kcal 단위)
 */
const SurveyScreen = ({ route, navigation }) => {
  // 사용자 평가를 위한 상태 관리
  const [satisfaction, setSatisfaction] = useState(0);
  const [comment, setComment] = useState("");

  // 만족도 평가 옵션
  const ratings = [
    { value: 1, label: "매우 불만족" },
    { value: 2, label: "불만족" },
    { value: 3, label: "보통" },
    { value: 4, label: "만족" },
    { value: 5, label: "매우 만족" },
  ];

  /**
   * 설문 제출 및 화면 이동 처리 함수
   *
   * 처리 순서:
   * 1. 입력값 유효성 검사
   * 2. 설문 데이터와 운동 데이터를 함께 로깅
   * 3. 사용자에게 제출 완료 알림
   * 4. 홈 화면으로 이동
   */
  const handleSubmit = () => {
    // 만족도를 선택하지 않은 경우 처리
    if (satisfaction === 0) {
      alert("만족도를 선택해주세요!");
      return;
    }

    // 현재 날짜와 시간 생성
    const currentDate = new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 설문 데이터 로깅
    console.log("\n===== 산책로 만족도 조사 =====");
    console.log("1. 설문 시간:", currentDate);
    console.log(
      "2. 만족도 평가:",
      ratings.find((r) => r.value === satisfaction)?.label
    );

    // 제출 완료 알림
    alert("설문이 제출되었습니다. 감사합니다!");

    // HomeScreen으로 이동
    navigation.navigate("HomeScreen");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 앱 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconContainer}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>산책로 만족도 조사</Text>
      </View>

      {/* 설문 컨테이너 */}
      <View style={styles.surveyContainer}>
        {/* 만족도 평가 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 산책로는 어떠셨나요?</Text>
          <View style={styles.ratingContainer}>
            {ratings.map((rating) => (
              <TouchableOpacity
                key={rating.value}
                style={[
                  styles.ratingButton,
                  satisfaction === rating.value && styles.ratingButtonSelected,
                ]}
                onPress={() => setSatisfaction(rating.value)}
              >
                <Text
                  style={[
                    styles.ratingText,
                    satisfaction === rating.value && styles.ratingTextSelected,
                  ]}
                >
                  {rating.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 제출 버튼 */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>제 출</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#d3d3d3",
  },
  iconContainer: {
    position: "absolute",
    left: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  surveyContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  ratingContainer: {
    gap: 10,
  },
  ratingButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  ratingButtonSelected: {
    backgroundColor: "#a7b5f5",
  },
  ratingText: {
    fontSize: 16,
    color: "#666",
  },
  ratingTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  commentInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#a7b5f5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});

export default SurveyScreen;
