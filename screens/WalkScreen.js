import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import Icon from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
// import { useNavigation } from "@react-navigation/native";

/**
 * WalkScreen 컴포넌트
 * 사용자의 실시간 운동 현황을 추적하고 표시하는 화면
 *
 * 주요 기능:
 * 1. 카카오맵을 사용한 실시간 위치 및 이동 경로 표시
 * 2. 운동 시간, 이동 거리, 소모 칼로리 계산 및 표시
 * 3. 운동 일시정지/재개/종료 기능
 *
 * 기술 스택:
 * - expo-location: 위치 추적
 * - react-native-webview: 카카오맵 표시
 * - Kakao Maps API: 지도 및 경로 표시
 */

const WalkScreen = ({ navigation, route }) => {
  const [elapsedTime, setElapsedTime] = useState(0); // 경과 시간 (초)
  const [distance, setDistance] = useState(0); // 이동 거리 (km)
  const [lastPosition, setLastPosition] = useState(null); // 마지막 위치 정보
  const [isPaused, setIsPaused] = useState(false); // 일시정지 상태
  const { selectedRoute } = route.params; // SelectionScreen에서 전달된 경로
  const webViewRef = useRef(null); // 카카오맵 WebView 참조

  /**
   * 카카오맵 초기화 및 업데이트를 위한 HTML 컨텐츠
   *
   * 구조:
   * 1. 카카오맵 SDK 로드
   * 2. 지도 컨테이너 설정
   * 3. 지도 초기화 함수 (initMap)
   * 4. 위치 업데이트 함수 (updatePosition)
   *
   * 주의사항:
   * - SDK 로드 실패를 대비한 재시도 로직 포함
   * - 전역 객체들은 window에 저장하여 관리
   * - 에러 발생 시 React Native로 메시지 전달
   */
  const HTML_CONTENT = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
            <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=ee3f182cf65977ba6cc1122393d2ea85"></script>
            <style>
                body { margin: 0; padding: 0; height: 100vh; }
                #map { width: 100%; height: 100%; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                // 카카오맵 SDK 로드 확인 및 초기화
                function initializeMap() {
                    if (typeof kakao === 'undefined') {
                        console.error('Kakao Maps SDK not loaded');
                        setTimeout(initializeMap, 500);
                        return;
                    }

                    // 지도 초기화 함수 정의
                    window.initMap = function(lat, lng) {
                        try {
                            const container = document.getElementById('map');
                            const options = {
                                center: new kakao.maps.LatLng(lat, lng),
                                level: 3
                            };
                            window.map = new kakao.maps.Map(container, options);
                            
                            // 경로 표시를 위한 폴리라인 설정
                            window.polyline = new kakao.maps.Polyline({
                                path: [],
                                strokeWeight: 5,
                                strokeColor: '#a7b5f5',
                                strokeOpacity: 0.7,
                                strokeStyle: 'solid'
                            });
                            window.polyline.setMap(window.map);
                            
                            window.ReactNativeWebView.postMessage('MAP_INITIALIZED');
                        } catch (error) {
                            console.error('Map initialization error:', error);
                            window.ReactNativeWebView.postMessage('MAP_INIT_ERROR: ' + error.message);
                        }
                    };

                    // 위치 업데이트 함수 정의
                    window.updatePosition = function(lat, lng) {
                        try {
                            if (!window.map || !window.polyline) {
                                console.error('Map not initialized');
                                return;
                            }
                            window.displaySelectedRoute = function(routePath) {
                              const pathCoordinates = routePath.map(coord => 
                                new kakao.maps.LatLng(coord.lat, coord.lng)
                              );

                              const recommendedPath = new kakao.maps.Polyline({
                                  path: pathCoordinates,
                                  strokeWeight: 5,
                                  strokeColor: '#28a745',
                                  strokeOpacity: 0.5,
                                  strokeStyle: 'dashed'
                              });
                              recommendedPath.setMap(window.map);
                            };
                            const position = new kakao.maps.LatLng(lat, lng);
                            
                            // 이동 경로 업데이트
                            const path = window.polyline.getPath();
                            path.push(position);
                            window.polyline.setPath(path);
                            
                            // 지도 중심 이동
                            window.map.setCenter(position);
                            
                            // 현재 위치 마커 관리
                            if (!window.currentMarker) {
                                window.currentMarker = new kakao.maps.Marker({
                                    position: position,
                                    map: window.map
                                });
                            } else {
                                window.currentMarker.setPosition(position);
                            }
                        } catch (error) {
                            console.error('Position update error:', error);
                        }
                    };
                }

                // 초기화 시작
                initializeMap();
            </script>
        </body>
        </html>
    `;

  /**
   * 위치 추적 설정 및 시작
   *
   * 순서:
   * 1. 위치 서비스 활성화 확인
   * 2. 위치 권한 확인 및 요청
   * 3. 초기 위치 설정
   * 4. 실시간 위치 추적 시작
   *
   * 위치 업데이트마다:
   * - 지도 업데이트
   * - 이동 거리 계산
   * - 마지막 위치 정보 저장
   */
  useEffect(() => {
    let locationSubscription = null;

    const setupLocation = async () => {
      try {
        // 위치 서비스 활성화 확인
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          Alert.alert(
            "위치 서비스 비활성화",
            "기기의 위치 서비스를 켜주세요.",
            [{ text: "확인", onPress: () => navigation.navigate("HomeScreen") }]
          );
          return;
        }

        // 위치 권한 확인 및 요청
        const { status: foregroundStatus } =
          await Location.getForegroundPermissionsAsync();

        if (foregroundStatus !== "granted") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "위치 권한 필요",
              "산책 거리를 측정하기 위해 위치 권한이 필요합니다.",
              [
                {
                  text: "확인",
                  onPress: () => navigation.navigate("HomeSreen"),
                },
              ]
            );
            return;
          }
        }

        // 초기 위치 설정
        const initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        setLastPosition({
          latitude: initialPosition.coords.latitude,
          longitude: initialPosition.coords.longitude,
        });

        // 지도 초기화
        const initScript = `initMap(${initialPosition.coords.latitude}, ${initialPosition.coords.longitude});`;
        webViewRef.current?.injectJavaScript(initScript);

        // 실시간 위치 추적 시작
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // 1초마다 업데이트
            distanceInterval: 1, // 1미터 이상 이동 시 업데이트
          },
          (location) => {
            const { latitude, longitude } = location.coords;

            if (!isPaused) {
              // 지도 업데이트
              const updateScript = `updatePosition(${latitude}, ${longitude});`;
              webViewRef.current?.injectJavaScript(updateScript);

              // 이동 거리 계산 및 업데이트
              if (lastPosition) {
                const newDistance = calculateDistance(
                  lastPosition.latitude,
                  lastPosition.longitude,
                  latitude,
                  longitude
                );
                setDistance((prev) => prev + newDistance);
              }
            }

            setLastPosition({ latitude, longitude });
          }
        );
      } catch (err) {
        console.warn("위치 설정 오류:", err);
        Alert.alert("위치 서비스 오류", `상세 오류: ${err.message}`, [
          { text: "확인", onPress: () => navigation.navigate("HomeSreen") },
        ]);
      }
    };

    setupLocation();

    // 클린업: 위치 추적 중단
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isPaused]);

  /**
   * 타이머 설정
   * isPaused 상태에 따라 타이머를 시작하거나 중지
   */
  useEffect(() => {
    let timer;
    if (!isPaused) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPaused]);

  /**
   * Haversine 공식을 사용한 두 지점 간 거리 계산
   * @param {number} lat1 시작 위치 위도
   * @param {number} lon1 시작 위치 경도
   * @param {number} lat2 도착 위치 위도
   * @param {number} lon2 도착 위치 경도
   * @returns {number} 거리 (km)
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // 지구 반지름 (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * 경과 시간 포맷팅
   * 60초 미만: 초 단위
   * 60초 이상: 분 단위
   */
  const formatElapsedTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds} s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} m`;
    }
  };

  /**
   * 거리 포맷팅
   * 10km 이상: 정수
   * 10km 미만: 소수점 1자리
   */
  const formatDistance = (distance) => {
    return distance >= 10 ? Math.floor(distance) : distance.toFixed(1);
  };

  /**
   * MET(Metabolic Equivalent of Task) 값을 사용한 칼로리 소모량 계산
   * @param {number} distance 이동 거리 (km)
   * @param {number} elapsedTime 운동 시간 (초)
   * @returns {number} 소모 칼로리 (kcal)
   *
   * 계산식: (MET * 3.5 * 체중) / 200 * (시간/60)
   * - MET: 3.5 (보통 걸음걸이 기준)
   * - 체중: 70kg (기본값)
   */
  const calculateCalories = (distance, elapsedTime) => {
    const MET = 3.5;
    const weight = 70;
    return ((MET * 3.5 * weight) / 200) * (elapsedTime / 60);
  };

  // 버튼 핸들러들
  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);
  const handleStop = () => {
    const calories = calculateCalories(distance, elapsedTime);
    navigation.navigate("EndScreen", {
      elapsedTime,
      distance,
      calories: Math.round(calories),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconContainer}>
          <Icon name="menu" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>SmartTracker</Text>
      </View>

      {/* 지도 */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: HTML_CONTENT }}
          style={styles.map}
          javaScriptEnabled={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
          }}
        />
      </View>

      {/* 정보 표시 영역 */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>산책 시간</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.infoValueNumber}>
                {elapsedTime < 60 ? elapsedTime : Math.floor(elapsedTime / 60)}
              </Text>
              <Text style={styles.infoValueUnit}>
                {elapsedTime < 60 ? "s" : "m"}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>거리</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.infoValueNumber}>
                {formatDistance(distance)}
              </Text>
              <Text style={styles.infoValueUnit}>km</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>칼로리</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.infoValueNumber}>
                {calculateCalories(distance, elapsedTime).toFixed(0)}
              </Text>
              <Text style={styles.infoValueUnit}>kcal</Text>
            </View>
          </View>
        </View>

        {/* 컨트롤 버튼 */}
        {isPaused ? (
          <>
            <TouchableOpacity style={styles.button} onPress={handleResume}>
              <Text style={styles.buttonText}>재시작</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleStop}>
              <Text style={styles.buttonText}>종 료</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handlePause}>
            <Text style={styles.buttonText}>중 단</Text>
          </TouchableOpacity>
        )}
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
  mapContainer: {
    width: "100%",
    height: "50%",
    marginBottom: 0,
    backgroundColor: "red", // 테스트용 배경색
  },
  map: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
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
    backgroundColor: "#d3d3d3",
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

export default WalkScreen;
