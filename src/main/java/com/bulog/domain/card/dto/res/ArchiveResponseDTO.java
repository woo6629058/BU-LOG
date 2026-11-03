package com.bulog.domain.card.dto.res;

import java.util.List;

public record ArchiveResponseDTO(
        long acquiredCount,
        long totalCount,
        List<ArchiveCardResponseDTO> cards
) {
}
