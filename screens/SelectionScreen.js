import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const SelectionScreen = ({ navigation, route }) => {
  // 라우트 파라미터 추출
  const { goal, time, distance, initialLocation } = route.params;
  const webViewRef = useRef(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [routes, setRoutes] = useState([]); // 경로 데이터를 저장할 상태
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태

  // 임시 경로 데이터
  const temporaryRoutes = [
    {
      id: 1,
      name: '경로 1',
      path: [
        { lat: 37.5665, lng: 126.9780 },
        { lat: 37.5651, lng: 126.9768 },
      ],
    },
    {
      id: 2,
      name: '경로 2',
      path: [
        { lat: 37.5665, lng: 126.9780 },
        { lat: 37.5671, lng: 126.9798 },
      ],
    },
    {
      id: 3,
      name: '경로 3',
      path: [
        { lat: 37.5665, lng: 126.9780 },
        { lat: 37.5645, lng: 126.9808 },
      ],
    },
  ];

  // 지도 로딩 상태 모니터링
  useEffect(() => {
    if (!isMapLoaded) {
      // 30초 후에도 지도가 로드되지 않으면 에러 표시
      const timeoutId = setTimeout(() => {
        if (!isMapLoaded) {
          Alert.alert(
            '지도 로딩 실패',
            '지도를 불러오는데 실패했습니다. 다시 시도해주세요.',
            [
              {
                text: '확인',
                onPress: () => navigation.goBack()
              }
            ]
          );
        }
      }, 30000);

      return () => clearTimeout(timeoutId);
    }
  }, [isMapLoaded]);

  // HTML 내용 - 보안 및 에러 처리 개선
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

                try {
                    console.log('Initializing map...');
                    const routes = ${JSON.stringify(temporaryRoutes)};
                    
                    const mapContainer = document.getElementById('map');
                    const mapOptions = {
                        center: new kakao.maps.LatLng(${initialLocation.latitude}, ${initialLocation.longitude}),
                        level: 4
                    };

                    map = new kakao.maps.Map(mapContainer, mapOptions);

                    // 각 경로를 지도에 표시
                    routes.forEach(route => {
                        const path = route.path.map(coord => 
                            new kakao.maps.LatLng(coord.lat, coord.lng)
                        );

                        // 경로 라인 생성
                        const polyline = new kakao.maps.Polyline({
                            path,
                            strokeWeight: 5,
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.7,
                            strokeStyle: 'solid'
                        });
                        polyline.setMap(map);
                        polylines.push(polyline);

                        // 시작점 마커 생성
                        const marker = new kakao.maps.Marker({
                            position: path[0],
                            map: map,
                            title: route.name
                        });
                        markers.push(marker);

                        // 마커 클릭 이벤트
                        kakao.maps.event.addListener(marker, 'click', () => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'ROUTE_SELECTED',
                                route: route
                            }));
                        });
                    });

                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MAP_INITIALIZED',
                        success: true
                    }));

                } catch (error) {
                    console.error('Map initialization error:', error);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MAP_INITIALIZED',
                        success: false,
                        error: error.message
                    }));
                }
            }

            // 초기화 시작
            initializeMap();
        </script>
    </body>
    </html>
`;

  // WebView 메시지 핸들러
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'MAP_INITIALIZED':
          console.log('Map initialization status:', data.success);
          setIsMapLoaded(data.success);
          if (!data.success) {
            console.error('Map initialization failed:', data.error);
            Alert.alert('초기화 실패', '지도를 초기화하는데 실패했습니다.');
          }
          break;

        case 'ROUTE_SELECTED':
          handleRouteSelection(data.route);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  // 경로 선택 핸들러
  const handleRouteSelection = (routeData) => {
    setSelectedRoute(routeData);
    // 진동 피드백 추가 가능
  };

  // 경로 확정 핸들러
  const confirmRoute = () => {
    if (!selectedRoute) {
      Alert.alert('경로 선택', '경로를 선택해주세요.');
      return;
    }

    navigation.navigate('WalkScreen', {
      goal,
      time,
      distance,
      initialLocation,
      selectedRoute,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: HTML_CONTENT }}
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
            Alert.alert('오류', '지도를 불러오는 중 오류가 발생했습니다.');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView HTTP error:', nativeEvent);
          }}
          onLoadEnd={() => console.log('WebView load completed')}
          onLoadStart={() => console.log('WebView load started')}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          androidLayerType="hardware"
          style={styles.webView}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {selectedRoute ? `선택된 경로: ${selectedRoute.name}` : '경로를 선택해주세요.'}
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            !selectedRoute && styles.buttonDisabled
          ]}
          onPress={confirmRoute}
          disabled={!selectedRoute}
        >
          <Text style={styles.buttonText}>확정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#a7b5f5',
    padding: 15,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    height: '75%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    opacity: 0.99,
    overflow: 'hidden',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: "#a7b5f5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#d3d3d3',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});

export default SelectionScreen;