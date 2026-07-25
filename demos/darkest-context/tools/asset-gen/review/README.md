# Style-test review snapshots

이 디렉토리는 스타일 판정·파이프라인 검증 증적이며 게임 asset이 아니다. 게임은
`demos/darkest-context/assets/`만 로드한다. 생성 증적의 최종 비교본은 라이선스
추적을 위해 `assets-manifest.json`에 기록하지만, 본 팩 asset의 manifest 항목에는
apothecary 선례처럼 생성에 사용한 프롬프트를 요약이나 참조가 아닌 verbatim으로
넣어야 한다.

- [`initial-prompt/`](./initial-prompt/README.md): 프롬프트·API 파라미터·키잉 수정 전
  최초 A–D 결과
- [`revised-pipeline/`](./revised-pipeline/README.md): 리뷰 요구사항을 적용한 A–D 결과

## B/C/D가 깨진 원인

1. 최초 호출은 Image API `background`를 지정하지 않아 `auto`로 동작했다. A 원본은
   불투명 배경이었지만 B/C/D 원본은 투명 알파를 포함해 반환됐다.
2. 기존 로직은 다운스케일한 뒤 네 코너의 RGB를 무조건 키 색상으로 사용했다.
   투명 코너의 RGB가 검정에 가까워지면서 어두운 캐릭터 픽셀까지 전역 톨러런스에
   들어가 B의 몸에 구멍이 생겼다.
3. 키잉보다 다운스케일을 먼저 수행해 캐릭터 가장자리와 마젠타가 섞였고 C/D에
   퍼플 프린지가 남았다. 어두운 팔레트 지시가 캐릭터 자체에 보라색을 쓰게 한 것도
   전역 키잉 피해를 키웠다.

수정본은 `background: "opaque"`를 명시하고, 기술용 마젠타를 캐릭터 팔레트에서
금지하며, 원본 코너 검증 후 원본 해상도에서 경계 flood-fill을 수행한다. 넓은 전역
톨러런스는 사용하지 않는다.

## 다크 스타일 채택 시 후속 조치

D 최종본 발밑에는 `G<100` strict 범위를 비껴간 muted-magenta blend 픽셀이
남아 있다. 현재 선택된 Style A에는 영향이 없지만 다크 스타일을 채택할 경우 strict
범위를 완화하거나 다운스케일 후 프린지 제거 패스를 추가해야 한다.
