import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";

/**
 * EndScreen 컴포넌트
 * 운동 종료 후 결과를 표시하고 기록을 저장하는 화면
 *
 * 데이터 흐름:
 * 1. WalkScreen에서 route.params를 통해 운동 데이터 수신
 * 2. 받은 데이터를 화면에 표시하기 적절한 형식으로 변환
 * 3. 기록 버튼 클릭 시 데이터를 로깅하고 홈 화면으로 이동
 *
 * route.params로 전달받는 데이터:
 * - elapsedTime: 운동 시간 (초 단위)
 * - distance: 이동 거리 (km 단위)
 * - calories: 소모 칼로리 (kcal 단위)
 */
const EndScreen = ({ route, navigation }) => {
  // WalkScreen에서 전달받은 운동 데이터
  const { elapsedTime, distance, calories } = route.params;

  /**
   * 운동 시간 포맷팅 함수
   * 사용자가 이해하기 쉬운 형태로 시간을 변환
   *
   * 변환 규칙:
   * - 60초 미만: '초(s)' 단위로 표시 (예: 45s)
   * - 60초 이상: '분(m)' 단위로 표시 (예: 3m)
   *
   * @param {number} totalSeconds - 총 운동 시간(초)
   * @returns {object} { value: number, unit: string }
   */
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) {
      return { value: seconds, unit: "s" };
    }
    return { value: minutes, unit: "m" };
  };

  /**
   * 이동 거리 포맷팅 함수
   * 거리값을 보기 좋게 반올림하여 표시
   *
   * 변환 규칙:
   * - 10km 미만: 소수점 1자리까지 표시 (예: 3.5km)
   * - 10km 이상: 정수로 표시 (예: 12km)
   *
   * @param {number} dist - 이동 거리(km)
   * @returns {object} { value: string, unit: 'km' }
   */
  const formatDistance = (dist) => {
    return {
      value: dist >= 10 ? Math.floor(dist) : dist.toFixed(1),
      unit: "km",
    };
  };

  // 포맷팅 함수 적용
  // timeFormat = { value: number, unit: 's' | 'm' }
  const timeFormat = formatTime(elapsedTime);
  // distanceFormat = { value: string, unit: 'km' }
  const distanceFormat = formatDistance(distance);

  /**
   * 운동 기록 저장 및 화면 이동 처리 함수
   *
   * 처리 순서:
   * 1. 현재 시간 정보 생성
   * 2. 운동 데이터를 콘솔에 로깅
   * 3. 사용자에게 저장 완료 알림
   * 4. 홈 화면으로 이동 (네비게이션 스택 초기화)
   */
  const handleRecord = () => {
    // 현재 날짜와 시간 생성
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 운동 데이터 로깅
    console.log("\n===== 운동 기록 =====");
    console.log("1. 운동 시간:", formattedDate);
    console.log("\n2. 운동 정보:");
    console.log(`  - 소요 시간: ${timeFormat.value}${timeFormat.unit}`);
    console.log(`  - 이동 거리: ${distanceFormat.value}${distanceFormat.unit}`);
    console.log(`  - 소모 칼로리: ${Math.round(calories)}kcal`);
    console.log("===================\n");

    // 사용자 피드백 제공
    alert("기록이 저장되었습니다!");

    // HomeScreen으로 이동 (뒤로 가기 방지를 위해 네비게이션 스택 초기화)
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
        <Text style={styles.headerText}>SmartTracker</Text>
      </View>

      {/* 운동 결과 표시 섹션 */}
      <View style={styles.infoContainer}>
        {/* 시간, 거리, 칼로리 정보 행 */}
        <View style={styles.infoRow}>
          {/* 운동 시간 */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>산책 시간</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.infoValueNumber}>{timeFormat.value}</Text>
              <Text style={styles.infoValueUnit}>{timeFormat.unit}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          {/* 이동 거리 */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>거리</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.infoValueNumber}>{distanceFormat.value}</Text>
              <Text style={styles.infoValueUnit}>{distanceFormat.unit}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          {/* 소모 칼로리 */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>칼로리</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.infoValueNumber}>{Math.round(calories)}</Text>
              <Text style={styles.infoValueUnit}>kcal</Text>
            </View>
          </View>
        </View>
        {/* 기록 저장 버튼 */}
        <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
          <Text style={styles.recordButtonText}>기 록</Text>
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
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
  },
  infoColumn: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
    color: "#555",
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  infoValueNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginRight: 2,
  },
  infoValueUnit: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 70,
    backgroundColor: "#ccc",
    marginHorizontal: 10,
  },
  recordButton: {
    backgroundColor: "#a7b5f5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  recordButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});

export default EndScreen;
