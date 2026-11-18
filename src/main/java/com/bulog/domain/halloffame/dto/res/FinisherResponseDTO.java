package com.bulog.domain.halloffame.dto.res;

import java.time.LocalDateTime;

/** 완주자 한 명. no가 완주 번호다. */
public record FinisherResponseDTO(
        Long no,
        String name,
        LocalDateTime finishedAt,
        long durationSeconds
) {
}
