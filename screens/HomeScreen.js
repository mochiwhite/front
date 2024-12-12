import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import Icon from "@expo/vector-icons/Ionicons";
import CustomPicker from "../src/components/CustomPicker";
import * as Location from "expo-location";

/**
 * HomeScreen 컴포넌트
 * 사용자가 걷기 운동의 목적, 시간, 거리를 설정하는 메인 화면
 *
 * 현재 구현 상태:
 * - 임시로 WalkScreen으로 직접 이동하도록 구현되어 있음
 * - 실제 구현에서는 선택 화면(이하 SelectionScreen로 가정)을 거쳐 WalkScreen으로 이동할 예정
 * - 파라미터 전달 구조도 SelectionScreen 구현 후 변경될 예정
 *
 * TODO:
 * 1. SelectionScreen 구현 후 네비게이션 흐름 변경
 * 2. 파라미터 전달 구조 최종화
 *
 * @param {object} navigation - React Navigation prop으로 화면 전환에 사용
 */
const HomeScreen = ({ navigation }) => {
  // 주요 상태값들
  const [goal, setGoal] = useState("diet"); // 운동 목적 (diet, fitness, health)
  const [time, setTime] = useState(30); // 목표 시간 (분)
  const [distance, setDistance] = useState(5); // 목표 거리 (km)

  // iOS Picker 모달 표시 여부를 제어하는 상태값들
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDistancePicker, setShowDistancePicker] = useState(false);

  // iOS Picker에서 임시로 선택된 값들을 저장하는 상태값들
  // 사용자가 취소할 경우 이전 값으로 되돌리기 위해 사용
  const [tempGoal, setTempGoal] = useState("diet");
  const [tempTime, setTempTime] = useState(30);
  const [tempDistance, setTempDistance] = useState(5);

  /**
   * Picker에서 '확인' 버튼을 눌렀을 때 실행되는 함수
   * 임시 저장값을 실제 상태값으로 적용하고 Picker를 닫음
   *
   * @param {string} type - 'goal', 'time', 'distance' 중 하나
   */
  const handlePickerConfirm = (type) => {
    switch (type) {
      case "goal":
        setGoal(tempGoal);
        setShowGoalPicker(false);
        break;
      case "time":
        setTime(tempTime);
        setShowTimePicker(false);
        break;
      case "distance":
        setDistance(tempDistance);
        setShowDistancePicker(false);
        break;
    }
  };

  /**
   * Picker에서 '취소' 버튼을 눌렀을 때 실행되는 함수
   * 임시 저장값을 이전 상태값으로 되돌리고 Picker를 닫음
   *
   * @param {string} type - 'goal', 'time', 'distance' 중 하나
   */
  const handlePickerCancel = (type) => {
    switch (type) {
      case "goal":
        setTempGoal(goal);
        setShowGoalPicker(false);
        break;
      case "time":
        setTempTime(time);
        setShowTimePicker(false);
        break;
      case "distance":
        setTempDistance(distance);
        setShowDistancePicker(false);
        break;
    }
  };

  /**
   * 현재 위치를 확인하고 운동 시작 절차를 진행하는 함수
   *
   * 현재 구현:
   * - 위치 권한 확인 및 현재 위치 정보 수집
   * - 수집된 정보 로깅
   * - SelectionScreen으로 이동
   */
  const getCurrentLocation = async () => {
    try {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("위치 권한이 거부되었습니다.");
        return;
      }

      // 현재 위치 정보 가져오기
      const location = await Location.getCurrentPositionAsync({});

      // 운동 시작 정보 로깅
      console.log("===== 운동 시작 정보 =====");
      console.log("\n1. 사용자 설정값:");
      console.log(`  - 운동 목적: ${getGoalLabel(goal)}`);
      console.log(`  - 목표 시간: ${time}분`);
      console.log(`  - 목표 거리: ${distance}km`);
      console.log("\n2. 현재 위치 정보:");
      console.log(`  - 위도: ${location.coords.latitude}`);
      console.log(`  - 경도: ${location.coords.longitude}`);
      console.log(`  - 정확도: ${location.coords.accuracy}m`);
      console.log(
        `  - 타임스탬프: ${new Date(location.timestamp).toLocaleString()}`
      );
      console.log("=======================");

      // SelectionScreen으로 이동
        navigation.navigate('SelectionScreen', {
            goal,
            time,
            distance,
            initialLocation: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }
        });
    } catch (error) {
      console.error("위치 정보를 가져오는 중 오류 발생:", error);
    }
  };

  /**
   * 운동 정보를 로깅하는 함수
   * 개발 및 디버깅 목적으로 사용
   */
  const logExerciseInfo = (location) => {
    console.log("===== 운동 시작 정보 =====");
    console.log("\n1. 사용자 설정값:");
    console.log(`  - 운동 목적: ${getGoalLabel(goal)}`);
    console.log(`  - 목표 시간: ${time}분`);
    console.log(`  - 목표 거리: ${distance}km`);
    console.log("\n2. 현재 위치 정보:");
    console.log(`  - 위도: ${location.coords.latitude}`);
    console.log(`  - 경도: ${location.coords.longitude}`);
    console.log(`  - 정확도: ${location.coords.accuracy}m`);
    console.log(
      `  - 타임스탬프: ${new Date(location.timestamp).toLocaleString()}`
    );
    console.log("=======================");
  };

  /**
   * 위치 정보 오류 처리 함수
   * 개발 모드에서는 기본 위치로 진행하고, 프로덕션에서는 적절한 오류 처리
   */
  const handleLocationError = (errorType, defaultLocation) => {
    if (__DEV__) {
      console.log("개발 모드: 기본 위치(서울시청)로 진행합니다.");
      handleExerciseStart({ coords: defaultLocation });
    }
    // TODO: 프로덕션 환경에서의 오류 처리 추가 필요
  };

  /**
   * 운동 시작 처리 함수
   * 현재는 WalkScreen으로 직접 이동하지만,
   * 향후에는 SelectionScreen을 거쳐 WalkScreen으로 이동하도록 변경될 예정
   */
  const handleExerciseStart = (location) => {
    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // 현재 구현: WalkScreen으로 직접 이동
    // navigation.navigate("WalkScreen", {
    //   time,
    //   distance,
    //   initialLocation: locationData,
    // });

    /* 향후 구현될 네비게이션 로직
        navigation.navigate('SelectionScreen', {
            goal,
            time,
            distance,
            initialLocation: locationData,
            // 추가 파라미터
            exerciseType: 'walking',
            userPreferences: {
                needStretching: true,
                needWarmup: true
            }
        });
        
        // SelectionScreen에서 WalkScreen으로 이동 시 사용될 파라미터 예시
        {
            goal,
            time,
            distance,
            initialLocation: locationData,
            preparationTime: number,
            stretchingDone: boolean,
            warmupDone: boolean,
            selectedRoute: object,
            musicPreference: string,
            ...기타 설정값들
        }
        */
  };

  // 운동 목적 선택 옵션
  const goalOptions = [
    { label: "다이어트", value: "diet" },
    { label: "체력 증진", value: "fitness" },
    { label: "건강 유지", value: "health" },
  ];

  /**
   * goal value에 해당하는 한글 label을 반환하는 함수
   *
   * @param {string} value - goal 값 ('diet', 'fitness', 'health')
   * @returns {string} 해당하는 한글 라벨
   */
  const getGoalLabel = (value) => {
    const option = goalOptions.find((opt) => opt.value === value);
    return option ? option.label : "";
  };

  /**
   * Picker 섹션을 렌더링하는 함수
   * iOS와 Android에서 서로 다른 방식으로 Picker를 표시
   *
   * @param {string} label - 표시될 라벨
   * @param {any} value - 현재 선택된 값
   * @param {string} type - Picker 타입 ('goal', 'time', 'distance')
   * @param {boolean} showPicker - Picker 표시 여부 (iOS only)
   * @param {any} tempValue - 임시 선택값 (iOS only)
   * @param {function} setTempValue - 임시 선택값 설정 함수 (iOS only)
   * @param {array} options - 선택 옵션 배열 (goal picker only)
   * @param {number} maxValue - 최대 선택 가능 값 (time, distance picker only)
   */
  const renderPickerSection = (
    label,
    value,
    type,
    showPicker,
    tempValue,
    setTempValue,
    options = null,
    maxValue = null
  ) => {
    if (Platform.OS === "ios") {
      return (
        <>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              // Picker를 열 때 임시 값을 현재 값으로 설정
              switch (type) {
                case "goal":
                  setTempGoal(goal);
                  setShowGoalPicker(true);
                  break;
                case "time":
                  setTempTime(time);
                  setShowTimePicker(true);
                  break;
                case "distance":
                  setTempDistance(distance);
                  setShowDistancePicker(true);
                  break;
              }
            }}
          >
            <Text style={styles.pickerButtonText}>
              {options ? getGoalLabel(value) : value}
            </Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          <CustomPicker
            visible={showPicker}
            onClose={() => handlePickerCancel(type)}
            value={tempValue}
            onChange={setTempValue}
            onConfirm={() => handlePickerConfirm(type)}
            onCancel={() => handlePickerCancel(type)}
            options={options}
            maxValue={maxValue}
            title={label}
          />
        </>
      );
    }

    // Android의 경우 네이티브 Picker를 사용
    return (
      <CustomPicker
        visible={true}
        onClose={() => {}}
        value={value}
        onChange={
          value === goal ? setGoal : value === time ? setTime : setDistance
        }
        onConfirm={
          value === goal ? setGoal : value === time ? setTime : setDistance
        }
        options={options}
        maxValue={maxValue}
        title={label}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 운동 목적 선택 Picker */}
        {renderPickerSection(
          "목적",
          goal,
          "goal",
          showGoalPicker,
          tempGoal,
          setTempGoal,
          goalOptions
        )}

        {/* 운동 시간 선택 Picker */}
        {renderPickerSection(
          "시간 (분)",
          time,
          "time",
          showTimePicker,
          tempTime,
          setTempTime,
          null,
          100
        )}

        {/* 운동 거리 선택 Picker */}
        {renderPickerSection(
          "거리 (km)",
          distance,
          "distance",
          showDistancePicker,
          tempDistance,
          setTempDistance,
          null,
          100
        )}

        {/* 운동 시작 버튼 */}
        <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>시 작</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: "#000",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#a7b5f5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});

export default HomeScreen;
