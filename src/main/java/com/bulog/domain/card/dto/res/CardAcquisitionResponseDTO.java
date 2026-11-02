package com.bulog.domain.card.dto.res;

public record CardAcquisitionResponseDTO(
        Long cardId,
        String exhibitId,
        boolean newlyAcquired
) {
}
