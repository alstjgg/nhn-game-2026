# Style-test review snapshots

스타일 테스트의 변경 전후를 PR에서 직접 비교하기 위한 검토 자료다. 게임에 실리는
asset pack이 아니며 `assets-manifest.json` 대상도 아니다.

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
