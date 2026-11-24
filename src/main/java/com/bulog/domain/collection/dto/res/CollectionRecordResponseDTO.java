package com.bulog.domain.collection.dto.res;

import java.time.LocalDateTime;

public record CollectionRecordResponseDTO(
        Long recordId,
        String exhibitId,
        String name,
        String era,
        String description,
        String imageUrl,
        LocalDateTime acquiredAt
) {
}
