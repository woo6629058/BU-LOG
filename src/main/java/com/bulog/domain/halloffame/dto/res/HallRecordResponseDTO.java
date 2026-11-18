package com.bulog.domain.halloffame.dto.res;

import com.bulog.domain.halloffame.entity.HallRecordType;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

/** 실시간 기록 한 줄. 종류에 없는 칸은 응답에서 빠진다. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record HallRecordResponseDTO(
        Long id,
        HallRecordType type,
        String name,
        String exhibitId,
        String exhibitName,
        String exhibitionRoom,
        Long finisherNo,
        Long durationSeconds,
        LocalDateTime occurredAt
) {
}
