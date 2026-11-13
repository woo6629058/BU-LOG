package com.bulog.domain.card.dto.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ArchiveCardResponseDTO(
        Long cardId,
        String exhibitId,
        String name,
        String era,
        String description,
        String imageUrl,
        String exhibitionRoom,
        Integer cardNumber,
        boolean acquired,
        LocalDateTime acquiredAt
) {
}
