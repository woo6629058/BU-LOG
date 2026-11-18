package com.bulog.domain.halloffame.dto.res;

import java.util.List;

/**
 * 명예의 전당 화면 전체.
 * total: 전체 완주자 수, today: 오늘 완주한 수, myNo: 내 완주 번호(아직 완주 전이면 null),
 * myName: 명단에 보이는 내 이름(회원은 닉네임, 게스트는 "게스트 0000")
 */
public record HallOfFameResponseDTO(
        long total,
        long today,
        Long myNo,
        String myName,
        List<FinisherResponseDTO> finishers,
        List<HallRecordResponseDTO> records
) {
}
