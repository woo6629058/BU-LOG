package com.bulog.domain.card.dto.res;

import java.time.LocalDateTime;

public record CardDetailResponseDTO(
        Long cardId,
        String exhibitId,
        String name,
        String era,
        String description,
        String imageUrl,
        LocalDateTime acquiredAt
) {
}
