# 어디까지

장소를 검색해 두 지점 사이의 자동차 도로 거리를 보여주는 정적 웹앱입니다.

## 실행 및 배포

`index.html`, `styles.css`, `app.js`를 정적 파일 호스팅에 배포하면 됩니다. 빌드 명령, 서버, Redis, API 키, 환경변수는 필요하지 않습니다.

- **GitHub Pages:** 저장소의 Settings → Pages에서 브랜치와 폴더(`/` 또는 `/docs`)를 선택합니다. 루트에 배포할 경우 기본 폴더를 선택합니다.
- **Vercel:** 이 폴더를 프로젝트로 가져와 배포합니다. 프레임워크는 Other로 두고 빌드 명령 없이 루트 디렉터리를 배포하면 됩니다.
- **로컬 확인:** 이 폴더에서 `python -m http.server 8000`을 실행한 뒤 `http://localhost:8000`을 엽니다. `file://`로 직접 열면 브라우저의 네트워크 제한으로 API 요청이 실패할 수 있습니다.

## 데이터 제공자

- 장소 이름과 좌표 검색: [Nominatim](https://nominatim.org/)
- 자동차 도로 경로와 거리: [OSRM 공개 데모 서버](https://project-osrm.org/)
- 경로 링크와 지도: [OpenStreetMap](https://www.openstreetmap.org/)

검색 결과에서 실제 장소를 선택해야 거리를 조회할 수 있습니다. Nominatim 공개 서버는 용량이 제한된 공용 서비스이므로 대량·자동 검색에 사용하지 말고 [사용 정책](https://operations.osmfoundation.org/policies/nominatim/)을 준수해 주세요. OSRM 공개 데모 서버 역시 서비스 보장이나 가용성 보장이 없으며, 자동차 경로만 제공합니다.
