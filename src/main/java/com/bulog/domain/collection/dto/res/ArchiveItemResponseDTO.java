package com.bulog.domain.collection.dto.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ArchiveItemResponseDTO(
        Long recordId,
        String exhibitId,
        String name,
        String era,
        String description,
        String imageUrl,
        String exhibitionRoom,
        Integer exhibitNumber,
        boolean acquired,
        LocalDateTime acquiredAt
) {
}
